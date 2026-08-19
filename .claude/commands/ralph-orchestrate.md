# /ralph-orchestrate - Orchestrate Multiple GitHub Issues Through Ralph Loop

Process multiple GitHub issues labeled `ralph:ready` through the complete Ralph Wiggum loop automatically, creating feature branches and PRs for each.

## Arguments

- `$ARGUMENTS` - Optional flags:
  - `--label <label>` - Label to filter issues (default: `ralph:ready`)
  - `--dry-run` - Analyze and plan but don't generate execution script
  - `--max <N>` - Maximum issues to process (default: no limit)
  - `--init` - Only create labels, don't process any issues (useful for bootstrapping new repos)

## Architecture Overview

This command has been refactored to avoid **context rot** and **context overflow decay**. Instead of maintaining Claude context throughout the entire orchestration loop, the command now:

1. **Triages** (Claude) - Fetches issues, analyzes dependencies, builds execution order, generates manifest
2. **Generates Bash Script** (Claude) - Creates `ralph-orchestrate.sh` that drives the outer loop
3. **Execution** (Bash + Fresh Claude Sessions) - User runs the generated script, which invokes fresh Claude sessions per issue

```
┌─────────────────────────────────────────────────────────────┐
│                    /ralph-orchestrate                       │
│                   (Claude Code Session #1)                  │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: TRIAGE                                            │
│  ├─ Fetch open issues with target label                     │
│  ├─ Parse explicit dependencies (depends-on: #N)            │
│  ├─ Topological sort into execution order                   │
│  ├─ Generate .ralph/orchestration-manifest.json             │
│  └─ Apply 'ralph:queued' labels                             │
│                                                             │
│  Phase 2: SCRIPT GENERATION                                 │
│  ├─ Generate .ralph/ralph-orchestrate.sh                    │
│  └─ Output instructions for running the script              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 ralph-orchestrate.sh                        │
│                   (Pure Bash Script)                        │
├─────────────────────────────────────────────────────────────┤
│  For each issue in priority order:                          │
│  ├─ Check dependencies met (read manifest)                  │
│  ├─ Create feature branch: ralph/issue-<N>                  │
│  ├─ claude -p "/ralphify <N>" ← Fresh Claude Session        │
│  ├─ .ralph/ralph.sh 20        ← Fresh Claude Sessions       │
│  ├─ Commit, push, create PR (gh CLI)                        │
│  ├─ claude -p "/ralph-cleanup" ← Fresh Claude Session       │
│  └─ Update labels, manifest state                           │
│                                                             │
│  On Failure:                                                │
│  ├─ Mark issue as ralph:failed                              │
│  ├─ Skip dependent issues                                   │
│  └─ Continue with independent issues                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Benefits

| Before (Context Rot) | After (Fresh Sessions) |
|----------------------|------------------------|
| Single Claude session for all issues | Fresh Claude session per issue |
| Context degrades over time | Clean slate for each issue |
| Single point of failure stops all | Graceful continuation on failure |
| No resume capability | Auto-resume from manifest state |
| Inline execution | Bash script drives orchestration |

---

## Workflow

### Phase 1: TRIAGE

#### Step 1.1: Parse Arguments

```bash
# Defaults
LABEL="ralph:ready"
DRY_RUN=false
MAX_ISSUES=""

# Parse $ARGUMENTS for flags
```

#### Step 1.2: Pre-flight Checks

Before anything else, verify the environment is ready:

```bash
# 1. Check git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Git working directory is not clean. Commit or stash changes first."
    exit 1
fi

# 2. Check we're on main/master
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    echo "WARNING: Not on main/master branch. Currently on: $current_branch"
    # Ask user to confirm or switch
fi

# 3. Check no existing ralph session
if [ -f ".ralph/plan.md" ]; then
    echo "ERROR: Active Ralph session exists. Run /ralph-cleanup first."
    exit 1
fi

# 4. Check gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "ERROR: GitHub CLI (gh) not installed."
    exit 1
fi

# 5. Check required labels exist (create if missing)
```

#### Step 1.3: Ensure Required Labels Exist (CRITICAL)

**YOU MUST** create the orchestration labels if they don't exist. This is critical for Confabulator scaffolding where repos start without these labels.

Run these commands to create/update labels (the `--force` flag makes this idempotent - safe to run on repos that already have the labels):

```bash
gh label create "ralph:ready" --color "0E8A16" --description "Ready for Ralph orchestration" --force
gh label create "ralph:queued" --color "FBCA04" --description "In the Ralph orchestration queue" --force
gh label create "ralph:in-progress" --color "1D76DB" --description "Currently being processed by Ralph" --force
gh label create "ralph:complete" --color "6F42C1" --description "Successfully processed by Ralph" --force
gh label create "ralph:failed" --color "D93F0B" --description "Ralph processing failed" --force
```

Report the result:
```
Labels ensured:
  ✓ ralph:ready
  ✓ ralph:queued
  ✓ ralph:in-progress
  ✓ ralph:complete
  ✓ ralph:failed
```

If any label creation fails (e.g., no repo write access), report the error and stop.

**If `--init` flag was provided**, stop here after creating labels:

```
╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Initialized                   ║
╚═══════════════════════════════════════════════════════════════╝

Labels created/verified:
  ✓ ralph:ready        - Add this to issues ready for processing
  ✓ ralph:queued       - Applied when issue enters the queue
  ✓ ralph:in-progress  - Applied during processing
  ✓ ralph:complete     - Applied when PR is created
  ✓ ralph:failed       - Applied if processing fails

Next steps:
  1. Add 'ralph:ready' label to issues you want to process
  2. Add 'depends-on: #N' in issue bodies to declare dependencies
  3. Run '/ralph-orchestrate' to process them
```

#### Step 1.4: Fetch Issues with Target Label

```bash
gh issue list --label "$LABEL" --state open --json number,title,body,labels --limit 100
```

If no issues found, report and exit:

```
No issues found with label 'ralph:ready'.

To prepare issues for orchestration:
1. Add the 'ralph:ready' label to issues you want processed
2. Add 'depends-on: #N' in the issue body to declare dependencies
3. Run /ralph-orchestrate again
```

#### Step 1.5: Parse Dependencies

For each issue, extract dependencies from the body:

- Pattern: `depends-on: #N` or `blocked-by: #N` (case insensitive)
- Also check for `Depends on #N` or `Blocked by #N` in prose

```javascript
// Regex patterns to find dependencies
const patterns = [
    /depends[- ]?on:?\s*#(\d+)/gi,
    /blocked[- ]?by:?\s*#(\d+)/gi,
];
```

#### Step 1.6: Build Dependency Graph and Topological Sort

Create a directed graph where edges point from dependencies to dependents. Then topological sort to get execution order.

If circular dependencies detected, STOP and report:

```
ERROR: Circular dependency detected!

Issue #42 depends on #45
Issue #45 depends on #42

Please resolve the circular dependency before running orchestration.
```

#### Step 1.7: Generate Orchestration Manifest

Create `.ralph/orchestration-manifest.json`:

```json
{
  "created_at": "2025-01-23T10:00:00Z",
  "updated_at": "2025-01-23T10:00:00Z",
  "status": "pending",
  "source_branch": "main",
  "label_filter": "ralph:ready",
  "issues": [
    {
      "number": 42,
      "title": "Issue title",
      "priority": 1,
      "dependencies": [],
      "status": "queued",
      "branch": null,
      "pr_number": null,
      "started_at": null,
      "completed_at": null,
      "error": null
    },
    {
      "number": 45,
      "title": "Another issue",
      "priority": 2,
      "dependencies": [42],
      "status": "queued",
      "branch": null,
      "pr_number": null,
      "started_at": null,
      "completed_at": null,
      "error": null
    }
  ]
}
```

#### Step 1.8: Apply Queued Labels

For each issue in the queue, update its label:

```bash
for issue in issues; do
    gh issue edit $issue --remove-label "ralph:ready" --add-label "ralph:queued"
done
```

#### Step 1.9: Report Triage Results

```
╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Triage Complete               ║
╚═══════════════════════════════════════════════════════════════╝

Issues found: 3
Execution order:
  1. #42 - Add user authentication (no dependencies)
  2. #45 - Add profile page (depends on #42)
  3. #48 - Add settings page (depends on #42)

Manifest saved to: .ralph/orchestration-manifest.json

[If --dry-run]: Dry run complete. No changes made.
[If not dry-run]: Generating execution script...
```

If `--dry-run`, stop here without generating the script.

---

### Phase 2: SCRIPT GENERATION

#### Step 2.1: Generate the Orchestration Script

Create `.ralph/ralph-orchestrate.sh` with the following content. **IMPORTANT**: Generate this file exactly as specified - it contains all the logic for the outer loop.

```bash
#!/bin/bash
# ralph-orchestrate.sh - Generated by /ralph-orchestrate
# Processes GitHub issues through Ralph loop with fresh Claude sessions
#
# Usage: ./ralph-orchestrate.sh [max_iterations_per_issue]
#   max_iterations_per_issue: Number of iterations for ralph.sh (default: 20)
#
# This script auto-resumes from manifest state. Safe to interrupt and restart.

set -o pipefail

MANIFEST_FILE=".ralph/orchestration-manifest.json"
LOG_FILE=".ralph/orchestration.log"
MAX_RALPH_ITERATIONS="${1:-20}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ensure .ralph directory exists
mkdir -p .ralph

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "$msg" | tee -a "$LOG_FILE"
}

log_section() {
    log ""
    log "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    log "${BLUE}  $1${NC}"
    log "${BLUE}════════════════════════════════════════════════════════════════${NC}"
}

# Update a field in the manifest for a specific issue
update_manifest_issue() {
    local issue=$1
    local field=$2
    local value=$3

    local tmp_file="${MANIFEST_FILE}.tmp"
    jq --argjson num "$issue" --arg field "$field" --argjson value "$value" \
       '(.issues[] | select(.number == $num))[$field] = $value' \
       "$MANIFEST_FILE" > "$tmp_file" && mv "$tmp_file" "$MANIFEST_FILE"
}

# Update manifest status field
update_manifest_status() {
    local status=$1
    local tmp_file="${MANIFEST_FILE}.tmp"
    jq --arg status "$status" '.status = $status | .updated_at = now | todate' \
       "$MANIFEST_FILE" > "$tmp_file" && mv "$tmp_file" "$MANIFEST_FILE"
}

# Set issue status with timestamp
set_issue_status() {
    local issue=$1
    local status=$2

    update_manifest_issue "$issue" "status" "\"$status\""

    if [[ "$status" == "in_progress" ]]; then
        update_manifest_issue "$issue" "started_at" "\"$(date -Iseconds)\""
    elif [[ "$status" == "complete" || "$status" == "failed" || "$status" == "skipped" ]]; then
        update_manifest_issue "$issue" "completed_at" "\"$(date -Iseconds)\""
    fi
}

# Check if all dependencies for an issue are complete
# Returns 0 if all deps met, 1 if blocked (echoes blocking issue number)
dependencies_met() {
    local issue=$1
    local deps
    deps=$(jq -r --argjson num "$issue" \
        '(.issues[] | select(.number == $num)).dependencies // [] | .[]' "$MANIFEST_FILE" 2>/dev/null)

    for dep in $deps; do
        [[ -z "$dep" ]] && continue
        local dep_status
        dep_status=$(jq -r --argjson num "$dep" \
            '(.issues[] | select(.number == $num)).status // "unknown"' "$MANIFEST_FILE")

        if [[ "$dep_status" != "complete" ]]; then
            echo "$dep"  # Return the blocking issue number
            return 1
        fi
    done
    return 0  # All dependencies met
}

# Process a single issue through the complete Ralph loop
process_issue() {
    local issue=$1
    local title=$2

    log_section "Processing Issue #$issue: $title"

    # Check dependencies
    local blocker
    if ! blocker=$(dependencies_met "$issue"); then
        log "${YELLOW}⏭  Skipping #$issue - blocked by #$blocker (not complete)${NC}"
        set_issue_status "$issue" "skipped"
        update_manifest_issue "$issue" "error" "\"Blocked by #$blocker\""
        return 2  # Skipped, not failed
    fi

    set_issue_status "$issue" "in_progress"
    gh issue edit "$issue" --remove-label "ralph:queued" --add-label "ralph:in-progress" 2>/dev/null || true

    # Ensure we're on main and up to date
    # NOTE: Do NOT use git stash/pop here. .ralph/ is in .gitignore so the manifest
    # doesn't need stashing, and stash pop can reintroduce merge conflicts from
    # stale stash entries left by previous orchestration runs.
    log "Checking out main branch..."
    git reset --mixed HEAD 2>/dev/null || true
    git checkout main || { log "${RED}✗ Failed to checkout main${NC}"; return 1; }
    git reset --mixed HEAD 2>/dev/null || true
    git pull origin main || { log "${RED}✗ Failed to pull main${NC}"; return 1; }

    # Create feature branch
    local branch_name="ralph/issue-$issue"
    log "Creating feature branch: $branch_name"
    git checkout -b "$branch_name" || {
        # Branch might already exist from a previous failed run
        log "${YELLOW}Branch exists, checking out...${NC}"
        git checkout "$branch_name" || { log "${RED}✗ Failed to checkout branch${NC}"; return 1; }
    }

    # Invoke fresh Claude session for ralphify
    log ""
    log "${CYAN}Running /ralphify $issue (fresh Claude session)...${NC}"
    if ! claude -p "/ralphify $issue" --dangerously-skip-permissions; then
        log "${RED}✗ Ralphify failed for #$issue${NC}"
        handle_failure "$issue" "Ralphify failed"
        return 1
    fi

    # Run the inner Ralph loop
    log ""
    log "${CYAN}Running ralph.sh with $MAX_RALPH_ITERATIONS iterations...${NC}"
    if [[ ! -x ".ralph/ralph.sh" ]]; then
        log "${RED}✗ .ralph/ralph.sh not found or not executable${NC}"
        handle_failure "$issue" "ralph.sh not found"
        return 1
    fi

    if ! .ralph/ralph.sh "$MAX_RALPH_ITERATIONS"; then
        log "${RED}✗ Ralph loop failed for #$issue${NC}"
        handle_failure "$issue" "Ralph loop failed after $MAX_RALPH_ITERATIONS iterations"
        return 1
    fi

    # Commit and push changes
    log ""
    log "Committing and pushing changes..."
    git add -A

    # Check if there are changes to commit
    if git diff --cached --quiet; then
        log "${YELLOW}No changes to commit${NC}"
    else
        git commit -m "feat(#$issue): $title

Implemented via Ralph Wiggum autonomous build loop.

Co-authored-by: Claude <noreply@anthropic.com>" || {
            log "${RED}✗ Commit failed${NC}"
            handle_failure "$issue" "Git commit failed"
            return 1
        }
    fi

    git push -u origin "$branch_name" || {
        log "${RED}✗ Push failed${NC}"
        handle_failure "$issue" "Git push failed"
        return 1
    }

    # Create pull request
    log ""
    log "Creating pull request..."
    local pr_url
    pr_url=$(gh pr create \
        --title "feat(#$issue): $title" \
        --body "## Summary

Automated implementation of #$issue via Ralph Wiggum orchestration.

## Related Issues

Closes #$issue

---
*Generated by Ralph Wiggum Orchestrator*" 2>&1) || {
        # PR might already exist
        if echo "$pr_url" | grep -q "already exists"; then
            log "${YELLOW}PR already exists for this branch${NC}"
            pr_url=$(gh pr view "$branch_name" --json url --jq '.url' 2>/dev/null) || true
        else
            log "${RED}✗ PR creation failed: $pr_url${NC}"
            handle_failure "$issue" "PR creation failed"
            return 1
        fi
    }

    # Extract PR number from URL (format: .../pull/123)
    local pr_number
    pr_number=$(echo "$pr_url" | grep -oE '/pull/[0-9]+' | grep -oE '[0-9]+' || true)

    if [[ -n "$pr_number" ]]; then
        update_manifest_issue "$issue" "pr_number" "$pr_number"
        log "${GREEN}✓ Created PR #$pr_number: $pr_url${NC}"
    fi

    update_manifest_issue "$issue" "branch" "\"$branch_name\""

    # Run cleanup (archive ralph files) - fresh Claude session
    log ""
    log "${CYAN}Running /ralph-cleanup (fresh Claude session)...${NC}"
    claude -p "/ralph-cleanup --no-close" --dangerously-skip-permissions 2>/dev/null || {
        log "${YELLOW}Cleanup had issues, but continuing...${NC}"
    }

    # Update labels and status
    set_issue_status "$issue" "complete"
    gh issue edit "$issue" --remove-label "ralph:in-progress" --add-label "ralph:complete" 2>/dev/null || true

    log ""
    log "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    log "${GREEN}  ✓ Successfully completed #$issue → PR #${pr_number:-unknown}${NC}"
    log "${GREEN}════════════════════════════════════════════════════════════════${NC}"

    # Return to main for next issue
    git reset --mixed HEAD 2>/dev/null || true
    git checkout main || true

    return 0
}

# Handle failure for an issue
handle_failure() {
    local issue=$1
    local error_msg=$2

    set_issue_status "$issue" "failed"
    update_manifest_issue "$issue" "error" "\"$error_msg\""

    gh issue edit "$issue" --remove-label "ralph:in-progress" --add-label "ralph:failed" 2>/dev/null || true
    gh issue comment "$issue" --body "⚠️ **Ralph orchestration failed**

Error: $error_msg

Check the orchestration log at \`.ralph/orchestration.log\` for details.

To retry:
1. Fix any issues manually
2. Remove the \`ralph:failed\` label and add \`ralph:ready\`
3. Run \`/ralph-orchestrate\` again" 2>/dev/null || true

    # Return to main branch
    git reset --mixed HEAD 2>/dev/null || true
    git checkout main 2>/dev/null || true
}

# Main execution
main() {
    # Check manifest exists
    if [[ ! -f "$MANIFEST_FILE" ]]; then
        echo -e "${RED}Error: $MANIFEST_FILE not found.${NC}"
        echo "Run /ralph-orchestrate first to generate the manifest and this script."
        exit 1
    fi

    log ""
    log "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║          Ralph Wiggum Orchestration - Starting                    ║${NC}"
    log "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    log "Manifest: $MANIFEST_FILE"
    log "Max iterations per issue: $MAX_RALPH_ITERATIONS"
    log ""

    update_manifest_status "in_progress"

    # Get issues in priority order, filter to incomplete only (queued or pending)
    local issues
    issues=$(jq -r '.issues | sort_by(.priority) | .[] |
        select(.status == "queued" or .status == "pending") |
        "\(.number)|\(.title)"' "$MANIFEST_FILE")

    if [[ -z "$issues" ]]; then
        log "${GREEN}All issues already processed!${NC}"
        log ""
        log "Summary from manifest:"
        jq -r '.issues[] | "  \(if .status == "complete" then "✓" elif .status == "failed" then "✗" elif .status == "skipped" then "⏭" else "○" end) #\(.number) - \(.title) [\(.status)]"' "$MANIFEST_FILE"
        exit 0
    fi

    local total=0
    local completed=0
    local failed=0
    local skipped=0

    # Count total issues to process
    total=$(echo "$issues" | grep -c '^' || echo 0)
    log "Issues to process: $total"
    log ""

    # Process each issue
    while IFS='|' read -r number title; do
        [[ -z "$number" ]] && continue

        process_issue "$number" "$title"
        local result=$?

        case $result in
            0) ((completed++)) ;;
            1) ((failed++)) ;;
            2) ((skipped++)) ;;
        esac

        log ""
    done <<< "$issues"

    # Final summary
    log ""
    log "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║          Ralph Wiggum Orchestration - Complete                    ║${NC}"
    log "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    log "Results:"
    log "  ${GREEN}✓ Completed: $completed${NC}"
    log "  ${RED}✗ Failed: $failed${NC}"
    log "  ${YELLOW}⏭ Skipped: $skipped${NC}"
    log ""

    # Show full summary
    log "Issue Summary:"
    jq -r '.issues | sort_by(.priority) | .[] |
        "  \(if .status == "complete" then "✓" elif .status == "failed" then "✗" elif .status == "skipped" then "⏭" else "○" end) #\(.number) - \(.title)\(if .pr_number then " → PR #\(.pr_number)" else "" end)\(if .error then " (\(.error))" else "" end)"' "$MANIFEST_FILE"

    if [[ $failed -gt 0 ]]; then
        update_manifest_status "failed"
        log ""
        log "${YELLOW}Some issues failed. To retry:${NC}"
        log "  1. Fix the issues manually or investigate the logs"
        log "  2. Remove 'ralph:failed' label and add 'ralph:ready'"
        log "  3. Run /ralph-orchestrate again"
        exit 1
    elif [[ $skipped -gt 0 && $completed -eq 0 ]]; then
        update_manifest_status "blocked"
        log ""
        log "${YELLOW}All remaining issues are blocked by failed dependencies.${NC}"
        exit 1
    else
        update_manifest_status "complete"
        log ""
        log "${GREEN}All issues processed successfully!${NC}"
        log "PRs are ready for review."
    fi
}

# Handle interrupts gracefully
trap 'echo -e "\n${YELLOW}Interrupted. Run this script again to resume.${NC}"; exit 130' INT TERM

main "$@"
```

#### Step 2.2: Make Script Executable

```bash
chmod +x .ralph/ralph-orchestrate.sh
```

#### Step 2.3: Output Final Instructions

```
╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Ready to Execute              ║
╚═══════════════════════════════════════════════════════════════╝

Generated files:
  ✓ .ralph/orchestration-manifest.json  (execution state)
  ✓ .ralph/ralph-orchestrate.sh         (orchestration script)

Issues queued: N
Execution order:
  1. #42 - Add user authentication (no dependencies)
  2. #45 - Add profile page (depends on #42)
  3. #48 - Add settings page (depends on #42)

To start processing:
  ./.ralph/ralph-orchestrate.sh

Options:
  ./.ralph/ralph-orchestrate.sh 30    # Use 30 iterations per issue (default: 20)

The script will:
  • Process each issue with fresh Claude sessions (no context rot)
  • Create feature branches and PRs automatically
  • Handle failures gracefully (skip dependents, continue independents)
  • Auto-resume from where it left off if interrupted

You can safely Ctrl+C and restart - progress is saved to the manifest.
```

---

## Issue Convention

For issues to work with Ralph orchestration:

1. **Label**: Must have `ralph:ready` label (or custom label if `--label` specified)

2. **Dependencies**: Declare explicitly in issue body:
   ```
   depends-on: #42
   ```
   or
   ```
   Blocked by #42, #43
   ```

3. **Content**: Should have clear acceptance criteria or checklist items

---

## GitHub Labels Reference

| Label | Color | Purpose |
|-------|-------|---------|
| `ralph:ready` | Green (#0E8A16) | Ready for orchestration |
| `ralph:queued` | Yellow (#FBCA04) | In the orchestration queue |
| `ralph:in-progress` | Blue (#1D76DB) | Currently being processed |
| `ralph:complete` | Purple (#6F42C1) | Successfully processed |
| `ralph:failed` | Red (#D93F0B) | Processing failed |

---

## Examples

### Basic Usage

```
User: /ralph-orchestrate

Claude:
╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Starting                      ║
╚═══════════════════════════════════════════════════════════════╝

Pre-flight checks...
  ✓ Git working directory clean
  ✓ On main branch
  ✓ No active Ralph session
  ✓ GitHub CLI available
  ✓ Labels exist

Fetching issues with label 'ralph:ready'...
  Found 2 issues

Analyzing dependencies...
  #42 - Add user authentication (no dependencies)
  #45 - Add profile page (depends on #42)

Execution order:
  1. #42
  2. #45

Applying labels...
  #42 → ralph:queued
  #45 → ralph:queued

Manifest created: .ralph/orchestration-manifest.json

╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Ready to Execute              ║
╚═══════════════════════════════════════════════════════════════╝

Generated files:
  ✓ .ralph/orchestration-manifest.json  (execution state)
  ✓ .ralph/ralph-orchestrate.sh         (orchestration script)

To start processing:
  ./.ralph/ralph-orchestrate.sh

The script will process each issue with fresh Claude sessions.
```

### Dry Run

```
User: /ralph-orchestrate --dry-run

Claude:
╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - DRY RUN                       ║
╚═══════════════════════════════════════════════════════════════╝

Pre-flight checks...
  ✓ All checks passed

Issues that would be processed:
  1. #42 - Add user authentication (no dependencies)
  2. #45 - Add profile page (depends on #42)

Dry run complete. No changes made.
To execute for real, run: /ralph-orchestrate
```

### Custom Label

```
User: /ralph-orchestrate --label sprint:current

Claude:
Fetching issues with label 'sprint:current'...
  Found 5 issues

[... continues ...]
```

### Initialize New Repo (Confabulator Scaffolding)

```
User: /ralph-orchestrate --init

Claude:
╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Initializing                  ║
╚═══════════════════════════════════════════════════════════════╝

Creating orchestration labels...
  ✓ ralph:ready (created)
  ✓ ralph:queued (created)
  ✓ ralph:in-progress (created)
  ✓ ralph:complete (created)
  ✓ ralph:failed (created)

╔═══════════════════════════════════════════════════════════════╗
║           Ralph Orchestration - Initialized                   ║
╚═══════════════════════════════════════════════════════════════╝

Labels created/verified:
  ✓ ralph:ready        - Add this to issues ready for processing
  ✓ ralph:queued       - Applied when issue enters the queue
  ✓ ralph:in-progress  - Applied during processing
  ✓ ralph:complete     - Applied when PR is created
  ✓ ralph:failed       - Applied if processing fails

Next steps:
  1. Add 'ralph:ready' label to issues you want to process
  2. Add 'depends-on: #N' in issue bodies to declare dependencies
  3. Run '/ralph-orchestrate' to process them
```

---

## Script Execution Example

After running `/ralph-orchestrate`, execute the generated script:

```bash
$ ./.ralph/ralph-orchestrate.sh

╔═══════════════════════════════════════════════════════════════════╗
║          Ralph Wiggum Orchestration - Starting                    ║
╚═══════════════════════════════════════════════════════════════════╝

Manifest: .ralph/orchestration-manifest.json
Max iterations per issue: 20

Issues to process: 2

════════════════════════════════════════════════════════════════
  Processing Issue #42: Add user authentication
════════════════════════════════════════════════════════════════

Checking out main branch...
Creating feature branch: ralph/issue-42

Running /ralphify 42 (fresh Claude session)...
[Claude session output...]

Running ralph.sh with 20 iterations...
[Ralph loop output...]

Committing and pushing changes...
Creating pull request...
✓ Created PR #123: https://github.com/user/repo/pull/123

Running /ralph-cleanup (fresh Claude session)...

════════════════════════════════════════════════════════════════
  ✓ Successfully completed #42 → PR #123
════════════════════════════════════════════════════════════════

════════════════════════════════════════════════════════════════
  Processing Issue #45: Add profile page
════════════════════════════════════════════════════════════════

[... continues ...]

╔═══════════════════════════════════════════════════════════════════╗
║          Ralph Wiggum Orchestration - Complete                    ║
╚═══════════════════════════════════════════════════════════════════╝

Results:
  ✓ Completed: 2
  ✗ Failed: 0
  ⏭ Skipped: 0

Issue Summary:
  ✓ #42 - Add user authentication → PR #123
  ✓ #45 - Add profile page → PR #124

All issues processed successfully!
PRs are ready for review.
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Git not clean | Report dirty files, ask user to commit/stash |
| No issues found | Report and suggest how to label issues |
| Circular dependencies | Report cycle, ask user to resolve |
| gh CLI missing | Report error, link to installation |
| Ralphify fails | Mark failed, continue with independent issues |
| ralph.sh fails | Mark failed, continue with independent issues |
| PR creation fails | Mark failed, continue with independent issues |
| Dependency failed | Skip dependent issues, continue with others |

### Failure Recovery

The bash script is designed for graceful failure handling:

1. **Failed issues**: Marked with `ralph:failed` label, error logged to manifest
2. **Dependent issues**: Automatically skipped when their dependencies fail
3. **Independent issues**: Continue processing even when others fail
4. **Resume**: Safe to Ctrl+C and restart - script reads manifest state

To retry failed issues:
1. Investigate and fix the underlying problem
2. Remove `ralph:failed` label, add `ralph:ready`
3. Run `/ralph-orchestrate` again (completed issues are skipped)

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `.ralph/orchestration-manifest.json` | Execution state tracking |
| `.ralph/ralph-orchestrate.sh` | Generated orchestration script |
| `.ralph/orchestration.log` | Execution log (created by script) |
| `.ralph/archive/issue-N/` | Archived session files |
| `ralph/issue-N` branches | Feature branches per issue |
| PRs | Pull requests per issue |
