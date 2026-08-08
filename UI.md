# UI/UX DESIGN SYSTEM & REBUILD PROMPT

## Image Puzzle PWA — Senior Product Designer + UI Engineer

You are now responsible ONLY for the **UI/UX, visual design system, responsive layout, interaction design, and frontend presentation layer** of an existing image puzzle PWA.

Act as a **senior product designer, design systems engineer, and frontend UI engineer**.

The existing application has a puzzle engine, PixiJS rendering, timer, movement tracking, IndexedDB, localStorage, and PWA infrastructure.

Your job is to make the application feel like a **high-quality modern puzzle product**, not a generic AI-generated dashboard.

---

# 0. MOST IMPORTANT RULE

Do NOT redesign the application by randomly adding:

* cards
* gradients
* glowing effects
* neon colors
* excessive rounded containers
* floating glass panels
* decorative blobs
* emoji
* unnecessary icons
* excessive animations
* dashboard-like widgets

The UI must feel **intentional, quiet, mature, premium, and functional**.

The puzzle itself is the visual hero.

Everything else should support the puzzle.

---

# 1. DO NOT TOUCH THE CORE GAME ENGINE

Unless absolutely necessary for integration, do NOT modify:

* puzzle generation
* piece validation
* PixiJS rendering architecture
* timer calculations
* movement tracking
* IndexedDB logic
* localStorage logic
* randomization
* puzzle mathematics
* completion detection

You may modify the presentation layer that consumes these systems.

If a UI requirement appears to require changing game logic, first determine whether an adapter/view-model can solve it.

Prefer:

```text
Existing Game Engine
        ↓
UI Adapter / State
        ↓
UI
```

rather than rewriting the engine.

---

# 2. VISUAL DIRECTION

The design language is:

```text
Quiet
Editorial
Minimal
Warm
Precise
Tactile
Premium
Human
Functional
```

Think:

* sophisticated creative software
* premium productivity application
* modern puzzle studio
* editorial interface
* calm design tool

NOT:

* gaming RGB UI
* cyberpunk
* neon gaming dashboard
* generic SaaS dashboard
* glassmorphism showcase website
* overly playful children's game
* futuristic HUD

The puzzle should feel like a **beautiful object on a quiet desk**.

---

# 3. COLOR SYSTEM — STRICT

Use ONLY the following semantic palette as the foundation.

```css
:root {
  --bg-dark: hsl(0 0% 90%);
  --bg: hsl(300 0% 95%);
  --bg-light: hsl(300 50% 100%);

  --text: hsl(300 0% 4%);
  --text-muted: hsl(0 0% 28%);

  --highlight: hsl(300 50% 100%);

  --border: hsl(0 0% 50%);
  --border-muted: hsl(340 0% 62%);

  --primary: hsl(178 100% 8%);
  --secondary: hsl(347 44% 31%);

  --danger: hsl(9 21% 41%);
  --warning: hsl(52 23% 34%);
  --success: hsl(147 19% 36%);
  --info: hsl(217 22% 41%);
}
```

Correct the invalid `NaN` from the supplied border value to a valid neutral HSL value.

Do not introduce random colors.

Do not introduce:

```text
neon green
neon blue
neon purple
neon pink
electric cyan
bright orange
fluorescent colors
rainbow gradients
```

Do not use saturated gradients.

Do not use colorful backgrounds.

Do not use a different accent color for every section.

---

# 4. COLOR HIERARCHY

Color should communicate hierarchy.

Use approximately:

```text
Background
    ↓
Surface
    ↓
Text
    ↓
Muted text
    ↓
Border
    ↓
Primary action
```

The primary color should be used sparingly.

Use the primary color for:

* primary CTA
* selected state
* important interaction
* active control

Do NOT make the entire UI primary-colored.

Secondary should be used sparingly for:

* supporting actions
* subtle emphasis
* selected secondary states

Success/danger/warning/info should only appear when communicating actual state.

Do not use status colors decoratively.

---

# 5. NO COLOR OVERLOAD

A screen should not look like:

```text
blue button
purple card
green statistic
orange badge
pink icon
red label
```

That creates visual noise.

Prefer:

```text
mostly neutral UI
+
one primary action
+
one meaningful state color when required
```

The puzzle image itself will provide most of the visual color.

The interface should deliberately stay neutral so the image remains dominant.

---

# 6. TYPOGRAPHY

Use a clean modern sans-serif.

Prefer system font stacks unless the project already includes a suitable font.

Example:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Do not use decorative fonts.

Do not use huge marketing-style headings everywhere.

Typography hierarchy should be controlled through:

* size
* weight
* line-height
* spacing
* muted color

not excessive font size.

---

# 7. TYPOGRAPHIC SCALE

Use a restrained scale.

Example:

```text
Display       40–48px
Page heading  28–32px
Section       18–20px
Body          14–16px
Small         12–13px
Micro         11–12px
```

Do not make every heading huge.

For the game screen, the timer can be visually prominent but should remain typographically elegant.

---

# 8. SPACING SYSTEM

Use a consistent spacing scale.

Base around:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Do not randomly use:

```text
13px
17px
27px
31px
43px
```

unless there is a genuine layout reason.

Use spacing tokens:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

---

# 9. SMART SPACING

Do NOT interpret "more whitespace" as "put huge gaps everywhere."

Spacing must communicate relationships.

Use:

```text
closer spacing
    ↓
things belong together

larger spacing
    ↓
new section / conceptual separation
```

Example:

```text
Timer
  8px
Move count
  24px
Puzzle
```

rather than:

```text
Timer




Move count




Puzzle
```

Avoid empty space that exists only to make the interface look "minimal."

Whitespace must have a structural purpose.

---

# 10. NO "BOX INSIDE BOX" DESIGN

This is extremely important.

Avoid:

```text
┌──────────────────────────────┐
│ Card                         │
│                              │
│  ┌────────────────────────┐  │
│  │ Card                   │  │
│  │                        │  │
│  │  ┌──────────────────┐  │  │
│  │  │ Card             │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

Do not put every piece of information into a card.

Instead use:

```text
Section
──────────────────────────────

Timer       Moves       Time

──────────────────────────────

Puzzle
```

Use borders, spacing, typography and alignment to establish hierarchy.

Cards should exist only when they provide a real interaction or grouping purpose.

---

# 11. SURFACE STRATEGY

Prefer:

```text
background
+
subtle surface difference
+
hairline border
+
spacing
```

instead of:

```text
background
+
card
+
inner card
+
inner card
+
shadow
+
glass
```

A section can be defined by whitespace alone.

---

# 12. GLASSMORPHISM

Use glassmorphism ONLY for temporary/floating UI.

Good candidates:

```text
Reference image
Floating game controls
Temporary notification
Result overlay
Contextual action panel
```

Do NOT use glassmorphism for the entire application.

Do NOT make the whole page:

```text
blurred background
glass card
glass card
glass card
glass card
```

Glass surfaces should be:

* subtle
* translucent
* restrained
* readable
* low blur
* low saturation

Example concept:

```css
background: color-mix(
  in srgb,
  var(--bg-light) 82%,
  transparent
);

backdrop-filter: blur(12px);
border: 1px solid color-mix(
  in srgb,
  var(--border-muted) 45%,
  transparent
);
```

Do not use giant exaggerated blur.

---

# 13. THE GAME SCREEN IS THE MOST IMPORTANT SCREEN

The game screen should prioritize:

```text
1. Puzzle
2. Timer / progress
3. Reference
4. Essential controls
5. Secondary actions
```

NOT:

```text
1. Header
2. Navigation
3. Cards
4. Statistics
5. Buttons
6. Puzzle
```

The puzzle must dominate the viewport.

---

# 14. GAME SCREEN LAYOUT

Desktop:

```text
┌───────────────────────────────────────────────────────┐
│  Puzzle                    02:41      36 pieces       │
│                                                       │
│                                                       │
│                    PUZZLE BOARD                       │
│                                                       │
│                                                       │
│                                                       │
│                                                       │
│                                      ┌─────────────┐   │
│                                      │ Reference   │   │
│                                      │             │   │
│                                      │    IMAGE    │   │
│                                      └─────────────┘   │
│                                                       │
│          Moves 48       Distance 1.2k       ↻         │
└───────────────────────────────────────────────────────┘
```

The exact layout may change based on viewport size, but maintain this hierarchy.

---

# 15. TIMER DESIGN

The timer should be visible but not obnoxious.

Avoid:

```text
████████████████████
      02:41
████████████████████
```

Prefer a simple typographic treatment:

```text
02:41
```

with a small contextual label if needed.

Before movement:

```text
READY
00:00
```

After first movement:

```text
02:41
```

The timer should not have a permanent pulsing animation.

No glowing timer.

No flashing timer.

No animated gradient.

---

# 16. GAME STATISTICS

Show only useful information.

Primary:

```text
Time
Moves
Pieces
```

Secondary:

```text
Distance
Hints
```

Do not turn every number into a separate colorful card.

Prefer a horizontal information row:

```text
02:41    ·    48 moves    ·    36 pieces
```

or a subtle segmented layout.

---

# 17. HOME SCREEN

The home screen should be simple.

Hierarchy:

```text
Puzzle
A quiet image puzzle experience.

[ Choose image ]

Normal
Jigsaw

Recent images
```

Do not build a dashboard.

Do not show 15 statistics before the user starts playing.

The primary action should be immediately obvious.

---

# 18. IMAGE SELECTION

User image selection should feel like a gallery, not a file manager.

Use:

* image previews
* compact metadata
* delete action
* add image button

Avoid huge cards with lots of text.

Example:

```text
Your images

┌───────┐ ┌───────┐ ┌───────┐
│ image │ │ image │ │ image │
│       │ │       │ │       │
└───────┘ └───────┘ └───────┘

+ Add image
```

The image should do most of the communication.

---

# 19. PUZZLE MODE SELECTION

Do not make giant cards.

Use compact segmented controls or visually balanced selection items.

Example:

```text
Puzzle type

[ Normal ] [ Jigsaw ]
```

Selected state should be obvious through:

* background
* border
* typography
* subtle contrast

Do not rely only on color.

---

# 20. BUTTON DESIGN

Buttons must have hierarchy.

### Primary

Use primary color.

```text
Start puzzle
```

### Secondary

Neutral border/surface.

```text
Change image
```

### Tertiary

Text/button-like control.

```text
Settings
```

### Destructive

Use danger only when actually destructive.

Avoid making every button look equally important.

---

# 21. BUTTON SHAPE

Avoid extreme pill-shaped UI everywhere.

Use moderate radius:

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
```

Use larger radius for floating surfaces if appropriate.

Do not make every element `border-radius: 9999px`.

---

# 22. BORDERS AND SHADOWS

Prefer subtle borders over heavy shadows.

Use:

```text
1px neutral border
```

for structural separation.

Shadows should be:

* soft
* low opacity
* used only when elevation matters

Avoid:

```text
huge black shadows
colored shadows
neon glow
```

---

# 23. ICONOGRAPHY

NEVER use emoji as UI icons.

Do not use:

```text
🎮
🧩
⚙️
💡
⏱️
🎉
🔥
```

Use SVG icons.

Preferred style:

* simple
* geometric
* consistent stroke width
* monochrome
* 16–20px
* visually balanced

Use an icon library if already installed or use a consistent SVG icon set.

Do not mix five different icon styles.

---

# 24. ICON RULE

Icons must have semantic purpose.

Don't add icons merely because an empty space exists.

Bad:

```text
[icon] Settings
[icon] Profile
[icon] Help
```

when the icon adds no information.

Good:

```text
Close
Zoom
Undo
Settings
Delete
```

where the icon improves recognition.

---

# 25. ANIMATION RULES

Animation must communicate something.

Allowed:

```text
page transition
piece snap
piece selection
button press
modal appearance
result appearance
image loading
```

Avoid:

```text
continuous floating
constant pulsing
background movement
looping gradients
rotating decorations
permanent particle effects
```

NO decorative infinite animation.

---

# 26. REDUCED MOTION

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Reduce or disable:

* transitions
* spring effects
* decorative movement

Gameplay must remain functional.

---

# 27. PUZZLE PIECE ANIMATION

Puzzle pieces are the exception where motion has gameplay meaning.

Use animation for:

```text
pickup
drag response
snap
lock
group connection
completion
```

Do not make pieces continuously move by themselves.

The user should always understand:

```text
I moved this piece
```

not:

```text
The interface is constantly moving.
```

---

# 28. MICRO-INTERACTIONS

Use subtle interaction feedback.

Example:

```text
hover
→ slight contrast change

press
→ slight scale/position response

selected
→ clear border/background

snap
→ short spring

completed
→ restrained success transition
```

Avoid exaggerated:

```text
bounce
shake
spin
zoom
flash
```

---

# 29. RESPONSIVE DESIGN

Do not simply scale desktop down.

Define layouts for:

### Large desktop

```text
large puzzle
reference at side
compact controls
```

### Laptop/tablet

```text
puzzle centered
reference floating
controls compact
```

### Mobile

```text
puzzle fills available space
reference accessible through compact floating control
bottom controls
large touch targets
minimal UI
```

The puzzle should receive the majority of available viewport space.

---

# 30. MOBILE TOUCH TARGETS

Interactive controls should generally have approximately:

```text
44px+
```

touch area.

Do not make visible icons tiny even if the clickable area is larger.

---

# 31. UI DENSITY

The application should feel neither:

```text
empty
```

nor:

```text
dashboard-packed
```

Aim for:

```text
high information quality
+
low visual noise
```

Every visible element should justify its existence.

If an element can be removed without hurting the experience, remove it.

---

# 32. EMPTY STATES

Empty states should be useful and calm.

Example:

```text
No saved images

Add an image to create your first puzzle.

[ Add image ]
```

Do not use giant illustrations or emoji.

---

# 33. RESULT SCREEN

After solving:

```text
Puzzle complete

02:41

48 moves
36 pieces

[ Play again ]
[ Choose another image ]
```

The completion state should feel rewarding through:

* typography
* spacing
* subtle motion
* clear hierarchy

NOT:

* confetti everywhere
* flashing colors
* huge emoji
* rainbow effects
* excessive particle animations

---

# 34. SETTINGS

Settings should be compact and organized.

Potential settings:

```text
Appearance
Sound
Reduced motion
Puzzle difficulty
Reference visibility
```

Use simple rows rather than cards inside cards.

Example:

```text
Settings
────────────────────────────

Appearance          System      >

Sound               On          >

Reduced motion      Auto        >

Reference           Visible     >
```

---

# 35. DESIGN TOKENS

Create centralized CSS variables.

Example:

```css
:root {
  /* Colors */
  --bg-dark: hsl(0 0% 90%);
  --bg: hsl(300 0% 95%);
  --bg-light: hsl(300 50% 100%);

  --text: hsl(300 0% 4%);
  --text-muted: hsl(0 0% 28%);

  --highlight: hsl(300 50% 100%);

  --border: hsl(0 0% 50%);
  --border-muted: hsl(340 0% 62%);

  --primary: hsl(178 100% 8%);
  --secondary: hsl(347 44% 31%);

  --danger: hsl(9 21% 41%);
  --warning: hsl(52 23% 34%);
  --success: hsl(147 19% 36%);
  --info: hsl(217 22% 41%);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* Layout */
  --content-max: 1440px;
  --page-padding: clamp(16px, 3vw, 40px);
}
```

The exact values may be refined, but maintain the design philosophy.

---

# 36. LIGHT/DARK THEMING

If dark mode is implemented, derive it from the same semantic system.

Do not simply invert every color.

Dark mode should preserve:

* hierarchy
* contrast
* muted surfaces
* primary accent
* border relationships

Dark mode must remain restrained.

No neon dark mode.

No glowing cyberpunk dark mode.

---

# 37. COMPONENT STRATEGY

Build reusable UI primitives only where useful.

Examples:

```text
Button
IconButton
SegmentedControl
Dialog
Drawer
ImageTile
Stat
Toolbar
Tooltip
Toast
```

Do not create a component abstraction for every `<div>`.

Avoid premature componentization.

---

# 38. CSS STRATEGY

Keep styles organized.

Recommended:

```text
styles/
├── tokens.css
├── reset.css
├── base.css
├── typography.css
├── layout.css
├── components.css
└── game.css
```

Do not create one enormous CSS file.

Do not scatter arbitrary inline styles everywhere.

---

# 39. VISUAL QA

After implementing each major screen, inspect it visually.

Check:

### Alignment

* Are edges aligned?
* Are controls sitting on a consistent grid?
* Are margins intentional?

### Spacing

* Are related elements close?
* Are sections clearly separated?
* Is there unnecessary empty space?

### Color

* Are there too many accents?
* Is text readable?
* Is the primary color overused?

### Hierarchy

Can the user immediately identify:

```text
What screen am I on?
What should I do?
What is important?
What can I ignore?
```

### Composition

Does the puzzle remain the visual focus?

---

# 40. DO NOT TRUST AI-GENERATED UI PATTERNS

Avoid automatically generating:

```text
hero section
three feature cards
gradient background
floating blobs
glass cards
statistics dashboard
large CTA
```

This is a puzzle application, not a SaaS landing page.

Design based on the actual product workflow.

---

# 41. REBUILD STRATEGY

Before changing the UI:

1. Audit the current UI.
2. Identify reusable functional components.
3. Identify visual problems.
4. Establish design tokens.
5. Establish layout system.
6. Rebuild Home screen.
7. Rebuild image selection.
8. Rebuild mode selection.
9. Rebuild Game screen.
10. Rebuild reference UI.
11. Rebuild controls.
12. Rebuild Result screen.
13. Rebuild Settings.
14. Test responsive layouts.
15. Perform final visual consistency pass.

Do NOT rebuild all screens simultaneously.

---

# 42. PHASED UI IMPLEMENTATION

## UI PHASE 1 — Design Foundation

Create:

* color tokens
* spacing tokens
* typography
* radius
* borders
* shadows
* icon rules
* responsive breakpoints

Do not redesign the whole app yet.

---

## UI PHASE 2 — Home

Build the home screen.

Focus on:

* hierarchy
* whitespace
* image selection
* mode selection
* primary action

No unnecessary dashboard elements.

---

## UI PHASE 3 — Image Library

Build:

* built-in puzzle images
* user images
* image preview
* add image
* delete
* selection state

Prioritize visual image browsing.

---

## UI PHASE 4 — Game Shell

Build:

* game header
* timer
* puzzle viewport
* reference image
* essential controls
* mobile controls

The puzzle must dominate the screen.

---

## UI PHASE 5 — Game Interaction

Integrate:

* piece selected state
* dragging feedback
* snapping feedback
* locked state
* jigsaw group feedback

Animations must remain subtle.

---

## UI PHASE 6 — Result

Build:

* completion state
* statistics
* replay
* new puzzle
* navigation back

No confetti/emoji overload.

---

## UI PHASE 7 — Settings

Build:

* appearance
* sound
* reduced motion
* reference settings
* difficulty

---

## UI PHASE 8 — Responsive QA

Test:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px
1920px
```

Fix layout problems.

Do not merely shrink elements.

---

## UI PHASE 9 — Visual Polish

Perform a complete audit:

```text
Color
Typography
Spacing
Alignment
Borders
Radius
Icons
Animation
Responsive behavior
Accessibility
```

Remove anything unnecessary.

---

# 43. FINAL UI CHECKLIST

Before declaring the UI complete:

### Color

* [ ] No neon colors
* [ ] No bright decorative colors
* [ ] No rainbow gradients
* [ ] Semantic palette is respected
* [ ] Primary color is restrained
* [ ] Status colors are meaningful

### Layout

* [ ] No box-inside-box abuse
* [ ] No unnecessary cards
* [ ] Spacing follows the scale
* [ ] Related elements are grouped
* [ ] Sections have intentional separation
* [ ] Puzzle dominates game screen

### Typography

* [ ] Clear hierarchy
* [ ] No oversized unnecessary headings
* [ ] Good line height
* [ ] Muted text is readable

### Icons

* [ ] No emoji
* [ ] Consistent SVG icon style
* [ ] Icons have semantic purpose

### Animation

* [ ] No infinite decorative loops
* [ ] No constant pulsing
* [ ] No unnecessary movement
* [ ] Gameplay feedback is animated appropriately
* [ ] Reduced-motion support exists

### Responsive

* [ ] Desktop works
* [ ] Tablet works
* [ ] Mobile works
* [ ] Touch targets are adequate
* [ ] Reference image works on mobile

### Overall

Ask:

> If I remove this element, does the experience become worse?

If the answer is no, remove it.

The goal is not to make the UI look "fancy."

The goal is to make it look **considered**.

---

# 44. FIRST ACTION

Do NOT immediately rewrite the application.

First:

1. Inspect the existing UI.
2. Inspect the current CSS.
3. Inspect the component/view structure.
4. Identify existing functional UI that must be preserved.
5. Create the design-token system.
6. Create a short `docs/UI-DESIGN.md`.
7. Produce a concise UI audit describing:

   * current problems
   * proposed hierarchy
   * proposed layout
   * reusable components
   * screens that need rebuilding
   * potential risks

Then implement **UI PHASE 1 only**.

Stop after Phase 1 and verify the application before continuing.

The design system must become the foundation for every subsequent UI screen.
