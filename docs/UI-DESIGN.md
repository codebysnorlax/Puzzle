# UI/UX Design System Specification & Audit

## 1. UI Audit & Current Visual Assessment

### Identified Visual Problems
- **Excessive Visual Noise**: Heavy glassmorphism blurs, saturated gradients, radial glows, and pill-shaped badges competing with puzzle artwork.
- **Card Nesting ("Box Inside Box")**: Multiple stacked containers with heavy borders on HomeView and SettingsView.
- **Inconsistent Palette**: Mix of indigo, cyan, violet, and rose accents creating visual distraction.
- **Emoji & Decorative Overload**: Use of emoji in result modal and excessive decorative icons.

### Proposed Visual Direction
- **Quiet & Editorial**: Warm, minimal, tactile aesthetic where the puzzle image is the visual hero.
- **Restrained Semantic Palette**: Strictly defined HSL tokens with high contrast and subtle hairline borders (`1px`).
- **Clear Information Hierarchy**: Functional typography with explicit scale (`--font-sans`).
- **No Emoji / Pure SVG**: Simple, monochrome, geometric SVG icons.

---

## 2. Design System Tokens (`src/styles/variables.css`)

```css
:root {
  /* Backgrounds */
  --bg-dark:    hsl(40 18% 89%);
  --bg:         hsl(40 20% 94%);
  --bg-light:   hsl(42 33% 98%);

  /* Text */
  --text:       hsl(30 18% 10%);
  --text-muted: hsl(30 9% 40%);

  /* Surfaces */
  --highlight:  hsl(42 33% 99%);

  /* Borders */
  --border:       hsl(35 10% 78%);
  --border-muted: hsl(35 12% 86%);

  /* Brand */
  --primary:    hsl(174 32% 22%);
  --secondary:  hsl(345 25% 34%);

  /* Semantic */
  --danger:     hsl(8 38% 38%);
  --warning:    hsl(38 42% 36%);
  --success:    hsl(150 27% 32%);
  --info:       hsl(210 30% 38%);

  /* Spacing System */
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

  /* Restrained Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* Typography */
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  /* Layout */
  --header-height: 56px;
  --content-max: 1200px;
}
```

---

## 3. UI Phase Roadmap

| Phase | Target | Status |
|---|---|---|
| **UI Phase 1** | Design Foundation (Tokens, Reset, Typography, Base CSS) | ⏳ In Progress |
| **UI Phase 2** | Home View (Minimal editorial layout, Segmented mode controls) | ⏳ Pending |
| **UI Phase 3** | Image Library (Compact preview gallery & file picker) | ⏳ Pending |
| **UI Phase 4** | Game Shell (Quiet HUD bar, prominent canvas viewport) | ⏳ Pending |
| **UI Phase 5** | Game Interaction Polish (Hover indicators, subtle tile transitions) | ⏳ Pending |
| **UI Phase 6** | Result View (Refrained statistics summary) | ⏳ Pending |
| **UI Phase 7** | Settings Modal (Compact organized rows) | ⏳ Pending |
| **UI Phase 8** | Responsive Pass (Mobile 320px to 1920px desktop) | ⏳ Pending |
| **UI Phase 9** | Final Visual Consistency Audit | ⏳ Pending |
