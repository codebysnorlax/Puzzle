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
  /* Quiet Semantic Color Palette */
  --bg-dark: hsl(0, 0%, 90%);
  --bg: hsl(300, 0%, 95%);
  --bg-light: hsl(300, 50%, 100%);

  --text: hsl(300, 0%, 4%);
  --text-muted: hsl(0, 0%, 28%);

  --highlight: hsl(300, 50%, 100%);

  --border: hsl(0, 0%, 50%);
  --border-muted: hsl(340, 0%, 62%);

  --primary: hsl(178, 100%, 8%);
  --secondary: hsl(347, 44%, 31%);

  --danger: hsl(9, 21%, 41%);
  --warning: hsl(52, 23%, 34%);
  --success: hsl(147, 19%, 36%);
  --info: hsl(217, 22%, 41%);

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
