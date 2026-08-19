#!/bin/bash
#
# Git Worktree Setup Script
# Project: Todo Cow
# Repository: https://github.com/scrollinondubs/todo-cow2
# Generated: 2026-08-19T12:55:50.710Z
#
# This script creates separate git worktrees for each task and epic,
# enabling parallel development without branch conflicts.
#

set -e  # Exit on error

echo "🌳 Setting up git worktrees for parallel development..."
echo ""

# ================================================
# EPICS
# ================================================

# Epic #1: Cow Management
# ✅ No dependencies - can start immediately
echo "Creating worktree for Epic #1..."
git worktree add ../epic-1-worktree -b epic/1-cow-management 2>/dev/null || echo "  Worktree already exists"

# Epic #3: Task Management
# ✅ No dependencies - can start immediately
echo "Creating worktree for Epic #3..."
git worktree add ../epic-3-worktree -b epic/3-task-management 2>/dev/null || echo "  Worktree already exists"

# Epic #6: Herd View
# ✅ No dependencies - can start immediately
echo "Creating worktree for Epic #6..."
git worktree add ../epic-6-worktree -b epic/6-herd-view 2>/dev/null || echo "  Worktree already exists"

# Epic #8: Technical Foundation
# ✅ No dependencies - can start immediately
echo "Creating worktree for Epic #8..."
git worktree add ../epic-8-worktree -b epic/8-technical-foundation 2>/dev/null || echo "  Worktree already exists"

# ================================================
# TASKS
# ================================================

# Task #2: Implement Cow Addition
# ⚠️  Dependencies: #5, #8
echo "Creating worktree for Task #2..."
git worktree add ../task-2-worktree -b task/2-implement-cow-addition 2>/dev/null || echo "  Worktree already exists"

# Task #4: Implement Task Addition
# ⚠️  Dependencies: #5, #8
echo "Creating worktree for Task #4..."
git worktree add ../task-4-worktree -b task/4-implement-task-addition 2>/dev/null || echo "  Worktree already exists"

# Task #5: Implement Task Completion
echo "Creating worktree for Task #5..."
git worktree add ../task-5-worktree -b task/5-implement-task-completion 2>/dev/null || echo "  Worktree already exists"

# Task #7: Implement Herd View Display
echo "Creating worktree for Task #7..."
git worktree add ../task-7-worktree -b task/7-implement-herd-view-display 2>/dev/null || echo "  Worktree already exists"

echo ""
echo "✅ Worktree setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. View all worktrees: git worktree list"
echo "2. Check dependencies: ./confabulator/worktree-status.sh"
echo "3. Start working: cd <worktree-directory>"
echo ""
echo "🔀 Recommended merge order (dependencies first):"
echo "  1. #1 - Cow Management"
echo "  2. #2 - Implement Cow Addition"
echo "  3. #3 - Task Management"
echo "  4. #4 - Implement Task Addition"
echo "  5. #6 - Herd View"
echo "  6. #7 - Implement Herd View Display"
echo ""
echo "To cleanup all worktrees: ./confabulator/cleanup-worktrees.sh"
