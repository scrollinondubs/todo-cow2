#!/bin/bash
#
# Git Worktree Status Script
# Project: Todo Cow
# Generated: 2026-08-19T12:55:50.711Z
#
# Shows the status of all worktrees and their dependencies.
#

echo "📊 Worktree Status - Todo Cow"
echo "="
echo ""

echo "📂 Active Worktrees:"
git worktree list
echo ""

echo "🔗 Dependency Summary:"
echo ""
echo "Epics:"
echo "  ✅ #1 - Cow Management (no dependencies)"
echo "  ✅ #3 - Task Management (no dependencies)"
echo "  ✅ #6 - Herd View (no dependencies)"
echo "  ✅ #8 - Technical Foundation (no dependencies)"
echo ""
echo "Tasks:"
echo "  ⚠️  #2 - Implement Cow Addition (depends on: #5, #8)"
echo "  ⚠️  #4 - Implement Task Addition (depends on: #5, #8)"
echo "  ✅ #5 - Implement Task Completion (no dependencies)"
echo "  ✅ #7 - Implement Herd View Display (no dependencies)"
echo ""
echo "🔀 Recommended Merge Order:"
echo "  1. 📦 #1 - Cow Management"
echo "  2. 📝 #2 - Implement Cow Addition"
echo "  3. 📦 #3 - Task Management"
echo "  4. 📝 #4 - Implement Task Addition"
echo "  5. 📦 #6 - Herd View"
echo "  6. 📝 #7 - Implement Herd View Display"
echo ""
echo "💡 Tips:"
echo "  - Work on tasks with no dependencies first"
echo "  - Merge branches in the order shown above"
echo "  - Check GitHub issues for detailed requirements"
echo ""