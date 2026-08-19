#!/bin/bash
#
# Git Worktree Cleanup Script
# Project: Todo Cow
# Generated: 2026-08-19T12:55:50.710Z
#
# This script removes all worktrees created by the setup script.
#

set -e  # Exit on error

echo "🧹 Cleaning up git worktrees..."
echo ""

# Confirm before proceeding
read -p "This will remove all worktrees. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cleanup cancelled."
  exit 0
fi

echo "Removing worktree: ../epic-1-worktree..."
git worktree remove ../epic-1-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../task-2-worktree..."
git worktree remove ../task-2-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../epic-3-worktree..."
git worktree remove ../epic-3-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../task-4-worktree..."
git worktree remove ../task-4-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../task-5-worktree..."
git worktree remove ../task-5-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../epic-6-worktree..."
git worktree remove ../epic-6-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../task-7-worktree..."
git worktree remove ../task-7-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"
echo "Removing worktree: ../epic-8-worktree..."
git worktree remove ../epic-8-worktree --force 2>/dev/null || echo "  Worktree not found or already removed"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To recreate worktrees: ./confabulator/setup-worktrees.sh"
