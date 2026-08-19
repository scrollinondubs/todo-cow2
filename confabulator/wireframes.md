# Wireframes: Todo Cow

## Overview & User Story Mapping

**Design Approach:** Todo Cow is designed as a minimalistic task management tool optimized for mobile use, focusing on ease of use and rapid task entry for herdsmen. The layout prioritizes single-hand usability, essential for on-the-go task management in farm environments.

**User Story → Screen Mapping:**
- US-1: Add Cow → Add Cow Screen
- US-2: Add Task → Add Task Screen
- US-3: Mark Task as Done → Herd View Screen
- US-4: Herd View → Herd View Screen

## Screen Flow Diagram

```
[Home] → [Add Cow] → [Herd View]
   ↓              ↓
[Sign In]     [Add Task]
   ↓              ↓
[Herd View]   [Mark Task as Done]
```

## ASCII Wireframes

### 1. Home Screen
**User Stories Enabled:** [US-1, US-2, US-3, US-4]

```
┌──────────────────────────────────────┐
│  [Todo Cow Logo]                     │
│                                      │
│  Welcome to Todo Cow                 │
│  Streamline your herd management     │
│                                      │
│  [Get Started →]                     │
│  <Learn More>                        │
│                                      │
└──────────────────────────────────────┘

        ↓ User clicks [Get Started →]

```

### 2. Add Cow Screen
**User Story Enabled:** [US-1]

```
┌──────────────────────────────────────┐
│  [Logo]                              │
│  Add a New Cow                       │
│                                      │
│  {Cow Name.................}         │
│  {Ear Tag Number..........}          │
│                                      │
│  [Add Cow →]                         │
│                                      │
│  <Back to Herd View>                 │
│                                      │
└──────────────────────────────────────┘

        ↓ After successful addition

```

### 3. Add Task Screen
**User Story Enabled:** [US-2]

```
┌──────────────────────────────────────┐
│  [Logo]  Select Cow                  │
│  Add Task for Cow                    │
│                                      │
│  (Select Cow ▼)                      │
│  {Task Title...............}         │
│  {Due Date.................}         │
│                                      │
│  [Add Task →]                        │
│                                      │
│  <Back to Herd View>                 │
│                                      │
└──────────────────────────────────────┘

        ↓ After successful task addition

```

### 4. Herd View Screen
**User Stories Enabled:** [US-3, US-4]

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]     Herd View  [Add Cow]  [Add Task]   [User ▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cows with Outstanding Tasks                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Cow Name 1       Tasks: 3  <View Details>            │  │
│  │  Cow Name 2       Tasks: 5  <View Details>            │  │
│  │  Cow Name 3       Tasks: 1  <View Details>            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Task Completion Status:                                    │
│  [ ] Task 1     [Done →]                                    │
│  [x] Task 2     [Undo →]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

        ↓ User interacts with task completion

```

### Responsive Variations

#### Herd View (Mobile)

```
┌────────────────────────┐
│  [☰] Logo  [User ▼]    │
├────────────────────────┤
│                        │
│  Herd View             │
│  ┌───────────────────┐ │
│  │ Cow 1 Tasks: 3    │ │
│  │ <Details>         │ │
│  ├───────────────────┤ │
│  │ Cow 2 Tasks: 5    │ │
│  │ <Details>         │ │
│  └───────────────────┘ │
│                        │
│  [Add Cow]  [Add Task] │
└────────────────────────┘
```

## Interactive States

### Button States
```
[Add Cow]  [Hover: underline]  [Disabled: gray]  [Loading: spinner]
```

### Form Validation
```
{Valid Input✓}   {Invalid Input✗ Please enter a valid name}
```

## Design System Quick Reference

- **Primary Action:** [Button] style for key actions like adding cows/tasks
- **Secondary Action:** <Link> style for navigation options
- **Input Fields:** {Field Name..........} style for user entries
- **Dropdowns:** (Select Option ▼) style for cow/task selections
- **Navigation:** Top bar with <Links> for major sections like Herd View

---

**NOTE:** All wireframes are drawn using ASCII art to convey layout and component interactions visually. Ensure each screen aligns with user stories by highlighting the features and flow needed for task management in the Todo Cow application.