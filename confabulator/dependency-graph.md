# Dependency Graph

```mermaid
graph TD

  1[[#1: Cow Management]]
  2[#2: Implement Cow Addition]
  3[[#3: Task Management]]
  4[#4: Implement Task Addition]
  5[#5: Implement Task Completion]
  6[[#6: Herd View]]
  7[#7: Implement Herd View Display]
  8[[#8: Technical Foundation]]

  5 -->|Database before API| 2
  5 -->|Database before API| 4
  8 -->|Database before API| 2
  8 -->|Database before API| 4

  classDef epicStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
  classDef taskStyle fill:#fff3e0,stroke:#e65100,stroke-width:1px
  class 1,3,6,8 epicStyle
  class 2,4,5,7 taskStyle
```

## Legend
- **Double box**: Epic
- **Single box**: Task
- **Arrow direction**: Dependency flow (A → B means B depends on A)

## About This Diagram

This diagram shows the dependencies between epics and tasks in your project. Use it to understand the order in which work should be completed and merged.

- **Epics** (double boxes) represent major features or components
- **Tasks** (single boxes) are specific implementation work items
- **Arrows** show dependencies (A → B means B depends on A completing first)

For parallel development using git worktrees, run:
```bash
./confabulator/setup-worktrees.sh
```
