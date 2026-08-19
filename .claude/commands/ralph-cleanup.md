# /ralph-cleanup - Archive Ralph Session and Close GitHub Issue

Archive completed Ralph session files and close the associated GitHub issue.

## Arguments

- `$ARGUMENTS` - Optional flags:
  - `--force` - Skip task completion check and cleanup anyway
  - `--no-close` - Archive files but don't close the GitHub issue
  - `--no-comment` - Don't post completion comment to GitHub

## Workflow

### Step 1: Check for Active Ralph Session

Verify `.ralph/plan.md` exists:

```bash
if [ ! -f ".ralph/plan.md" ]; then
    echo "No active Ralph session found. Nothing to clean up."
    exit 0
fi
```

### Step 2: Extract Issue Information

Parse the issue number from `.ralph/plan.md` or `.ralph/activity.md`:

Look for patterns like:

- `Issue #123`
- `GitHub Issue: #123`
- In the activity log header

Store the issue number for later GitHub operations.

### Step 3: Verify Task Completion

Read `.ralph/plan.md` and check if all tasks have `passes: true`.

```bash
# Count tasks with passes: false
incomplete=$(grep -c '"passes": false' .ralph/plan.md || echo "0")
```

If any tasks are incomplete and `--force` is not provided, STOP and report:

```
Cannot cleanup: <N> tasks still incomplete in .ralph/plan.md

Incomplete tasks:
- Task #2: Implement user authentication (passes: false)
- Task #5: Write integration tests (passes: false)

Options:
1. Complete the remaining tasks first
2. Run `/ralph-cleanup --force` to archive anyway
```

### Step 4: Generate Session Summary

Create a summary of what was accomplished:

```markdown
## Ralph Session Summary

**Issue:** #<NUMBER> - <TITLE>
**Date:** <CURRENT_DATE>
**Tasks Completed:** <COMPLETED>/<TOTAL>

### Completed Tasks

- [x] Task 1: <description>
- [x] Task 2: <description>
      ...

### Session Duration

Started: <start_time from activity.md>
Completed: <current_time>
Iterations: <count from activity.md>
```

### Step 5: Archive Session Files

Create archive copies in a folder per issue:

```bash
# Create timestamp
timestamp=$(date "+%Y-%m-%d")
issue_num="<EXTRACTED_ISSUE_NUMBER>"

# Create folder per issue
mkdir -p ".ralph/archive/issue-${issue_num}"

# Archive all files to issue folder
cp .ralph/plan.md ".ralph/archive/issue-${issue_num}/plan.md"
cp .ralph/activity.md ".ralph/archive/issue-${issue_num}/activity.md"
cp .ralph/PROMPT.md ".ralph/archive/issue-${issue_num}/PROMPT.md"
cp .ralph/ralph.sh ".ralph/archive/issue-${issue_num}/ralph.sh"
```

### Step 6: Post GitHub Comment (unless --no-comment)

Post a completion comment to the GitHub issue:

```bash
gh issue comment <issue_number> --body "$(cat <<'EOF'
## Ralph Session Complete

This issue was implemented using the Ralph Wiggum autonomous build loop.

### Summary
- **Tasks Completed:** <COMPLETED>/<TOTAL>
- **Iterations:** <COUNT>
- **Date:** <DATE>
- **Archived to:** `.ralph/archive/issue-<NUMBER>/`

### Completed Tasks
<LIST_OF_COMPLETED_TASKS>

### Files Changed
<GIT_DIFF_STAT_OR_FILE_LIST>

---
*Automated comment from Ralph Wiggum build loop*
EOF
)"
```

### Step 7: Close GitHub Issue (unless --no-close)

Close the issue if all tasks passed:

```bash
gh issue close <issue_number> --comment "Completed via Ralph autonomous build loop"
```

If `--force` was used with incomplete tasks, add a note:

```bash
gh issue close <issue_number> --comment "Partially completed via Ralph (some tasks incomplete). See issue for details."
```

### Step 8: Remove Working Files

Clean up the active session files:

```bash
rm -f .ralph/ralph.sh
rm -f .ralph/PROMPT.md
rm -f .ralph/plan.md
rm -f .ralph/activity.md
```

### Step 9: Output Success Message

```
Ralph session archived successfully!

Session Summary:
  Issue: #<NUMBER> - <TITLE>
  Tasks: <COMPLETED>/<TOTAL> completed

Archived to:
  .ralph/archive/issue-<NUMBER>/
    ├── plan.md
    ├── activity.md
    ├── PROMPT.md
    └── ralph.sh

GitHub:
  Comment posted: Yes
  Issue closed: Yes (#<NUMBER>)

Working files removed. Ready for next session.
```

## Error Handling

- If GitHub operations fail, continue with local cleanup and report the error
- If archive directory doesn't exist, create it
- If issue number cannot be determined, skip GitHub operations and warn user

## Examples

### Normal Cleanup (all tasks complete)

```
User: /ralph-cleanup

Claude:
Checking Ralph session status...
  Issue: #124 - Build School Guided Program
  Tasks: 12/12 complete

Archiving session files...
  Created: .ralph/archive/issue-124/
  Archived: plan.md, activity.md, PROMPT.md, ralph.sh

Posting completion comment to GitHub issue #124...
  Comment posted successfully

Closing GitHub issue #124...
  Issue closed

Removing working files...
  Removed: .ralph/ralph.sh
  Removed: .ralph/PROMPT.md
  Removed: .ralph/plan.md
  Removed: .ralph/activity.md

Ralph session archived successfully!
```

### Incomplete Tasks

```
User: /ralph-cleanup

Claude:
Checking Ralph session status...
  Issue: #124 - Build School Guided Program
  Tasks: 10/12 complete

Cannot cleanup: 2 tasks still incomplete

Incomplete tasks:
- Task #11: Write E2E tests (passes: false)
- Task #12: Update documentation (passes: false)

Options:
1. Complete the remaining tasks: .ralph/ralph.sh 10
2. Force cleanup anyway: /ralph-cleanup --force
```

### Force Cleanup

```
User: /ralph-cleanup --force

Claude:
Checking Ralph session status...
  Issue: #124 - Build School Guided Program
  Tasks: 10/12 complete (--force flag used)

Archiving session files...
  Created: .ralph/archive/issue-124/
  Archived: plan.md, activity.md, PROMPT.md, ralph.sh

Posting completion comment to GitHub issue #124...
  Comment posted (noted: 2 tasks incomplete)

Closing GitHub issue #124...
  Issue closed with partial completion note

Removing working files...
  Done

Ralph session archived (with incomplete tasks).
```

### Archive Only (no GitHub changes)

```
User: /ralph-cleanup --no-close --no-comment

Claude:
Checking Ralph session status...
  Issue: #124 - Build School Guided Program
  Tasks: 12/12 complete

Archiving session files...
  Created: .ralph/archive/issue-124/
  Archived: plan.md, activity.md, PROMPT.md, ralph.sh

Skipping GitHub operations (--no-close --no-comment)

Removing working files...
  Done

Ralph session archived successfully!
```
