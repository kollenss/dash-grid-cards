# Dash Grid — Plugin Card Developer Guide

Everything needed to build, test, and publish a community plugin card.

---

## Anatomy of a plugin card

```
cards/
  my-card/
    src/
      index.tsx          ← entry: injects CSS + calls registerCard()
      MyCard.tsx         ← React component
      MyCard.css         ← styles
      MyConfigUI.tsx     ← optional config form (shown in Add Card modal)
    dist/
      card.js            ← built IIFE bundle (git-tracked, served via GitHub raw)
    package.json
    vite.config.ts
    tsconfig.json
```

---

## Step-by-step: create a new card

### 1. Scaffold from template

Copy `cards/avgangstavlan/` and rename everything. Or create from scratch using the templates below.

### 2. `package.json`

```json
{
  "name": "dash-grid-card-my-card",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vite-plugin-css-injected-by-js": "^3.5.2"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

### 3. `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['iife'],
      name: 'DGCard_my_card',      // ← must be unique, no hyphens
      fileName: () => 'card.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'window.__dashgrid.React',
          'react-dom': 'window.__dashgrid.ReactDOM',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
```

> **Host globals:** `window.__dashgrid` exposes `{ React, ReactDOM, registry }`.
> Both `react` and `react-dom` are available as peer deps — import freely, including
> hooks, `createPortal`, etc. Do NOT bundle them (they are in `external` above).

### 4. `src/index.tsx` — entry point

```tsx
import { registerCard } from '../../../sdk/registry'
import MyCard from './MyCard'
import MyConfigUI from './MyConfigUI'   // omit if no config
import cardCss from './MyCard.css?inline'

;(function injectStyles() {
  const style = document.createElement('style')
  style.setAttribute('data-card', 'my-card')
  style.textContent = cardCss
  document.head.appendChild(style)
})()

registerCard({
  type: 'my-card',
  label: 'My Card',
  icon: '🃏',
  group: 'Static',           // Static | Sensors | Control | Media | Transport
  defaultSize: [2, 2],
  minSize: [2, 2],           // optional
  needsEntity: false,        // true = requires HA entity picker
  component: MyCard,
  configUI: MyConfigUI,      // optional
})
```

### 5. `src/MyCard.tsx` — component

```tsx
import type { CardProps } from '../../../sdk/types'

interface Props extends CardProps {
  config: { title?: string }
}

export default function MyCard({ config, colSpan, rowSpan }: Props) {
  return (
    <div className="glass-card my-card">
      {config.title}
    </div>
  )
}
```

> **Important:** `glass-card` is a global class injected by the host app — do NOT import or re-declare it.

### 6. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## Development iteration (rapid UI work)

For fast iteration while building the card — not a substitute for Phase 1 testing.

1. `cd cards/my-card && npm install && npm run build`
2. Copy `dist/card.js` → `C:\Dev\hassDasboard\plugins\my-card.js`
3. Insert DB row so the dashboard loads the bundle:

```js
// Run from C:\Dev\hassDasboard — rapid iteration only, bypasses real install flow
const Database = require('better-sqlite3');
const db = new Database('./data/hassboard.db');   // NOTE: hassboard.db, not dash.db
db.prepare('DELETE FROM plugins WHERE id = ?').run('my-card');
db.prepare('INSERT INTO plugins (id, name, version, bundle_url, installed_at) VALUES (?, ?, ?, ?, ?)')
  .run('my-card', 'My Card', '0.0.1-dev', '/plugins/my-card.js', new Date().toISOString());
```

4. Start the dashboard and verify the card renders.

> **Important:** This skips the gallery install flow entirely. Use it only for iterating on UI and logic — never as a substitute for Phase 1 testing.

> **Note:** `plugins/` is gitignored in `hassDasboard` — never commit the local copy. The bundle that gets installed by users is always fetched from the GitHub raw URL in `bundleUrl`.

---

## Test routine for community plugins

**Phase 1 requires the card to exist on GitHub** — the test is the gallery install flow itself. Push to GitHub with `status: "preview"` before starting Phase 1.

Always run these three phases in order.

### Before Phase 1 — push to GitHub as preview

1. Build: `npm run build`
2. Add entry to `manifest.json` with `"status": "preview"` (see Publishing section)
3. Push both the bundle and the manifest to GitHub
4. Remove any manually inserted DB row so the slate is clean:

```js
const Database = require('better-sqlite3');
const db = new Database('./data/hassboard.db');
db.prepare('DELETE FROM plugins WHERE id = ?').run('my-card');
```

5. Restart the dashboard

### Phase 1 — Install & uninstall

Test via the Plugin Gallery — the same flow a community user would experience.

- [ ] Dashboard starts without JS errors in the console
- [ ] Card appears in Plugin Gallery under the "Preview" toggle
- [ ] Install button works — card appears in the "Add card" picker under the correct group
- [ ] Card can be added to the grid
- [ ] Card can be removed from the grid
- [ ] Card can be added again (no duplicate-registration errors)
- [ ] Uninstall via Plugin Gallery removes the card from the picker
- [ ] After uninstall, refreshing the dashboard shows no errors
- [ ] Re-install works cleanly

### Phase 2 — Integrations

- [ ] If `needsEntity: true`: entity picker appears, selecting an entity works, wrong domain shows validation error
- [ ] If custom `integrations`: settings fields appear, saving persists, test-endpoint returns success/error correctly
- [ ] Config UI fields (if any) save correctly and survive a page refresh

### Phase 3 — Functionality

- [ ] Golden path works end-to-end
- [ ] Card renders correctly at `defaultSize`
- [ ] Card renders correctly at `minSize` (if different)
- [ ] Card renders correctly when resized larger
- [ ] Responsive layout has no overflow or clipped text
- [ ] All interactive elements work (buttons, toggles, overlays, canvas, etc.)
- [ ] No visual regressions on other cards on the same dashboard

---

## Design rules & CSS

### Use the host's global classes

These are always available in the browser context — no import needed:

| Class | Purpose |
|-------|---------|
| `glass-card` | Outer wrapper: glassmorphism bg, border, radius, hover lift |
| `card-label` | Small uppercase label at top of card |
| `card-value-hero` | Large primary value (48px, weight 200) |
| `card-value-large` | Secondary large value (34px, weight 300) |
| `card-unit` | Unit suffix next to value |
| `card-sub` | Small secondary text, pushed to bottom |

### Design tokens (CSS variables, always available)

```css
/* Typography */
--hb-text-primary      /* white, full opacity */
--hb-text-secondary    /* white 65% */
--hb-text-dim          /* white 55% */

/* Accent */
--hb-accent            /* #5ac8fa */
--hb-accent-rgb        /* 90, 200, 250 — use with rgba() */
--hb-accent-dim        /* rgba(accent, 0.20) */

/* Status */
--hb-status-on         /* #34c759 green */
--hb-status-off        /* white 20% */
--hb-status-caution    /* #ffd60a yellow */
--hb-status-warning    /* #ff9f0a orange */
--hb-status-error      /* #ff3b30 red */

/* Card surface */
--hb-card-bg           /* glass background (computed by theme) */
--hb-card-border       /* rgba(255,255,255,0.18) */
--hb-card-radius       /* 20px (user-adjustable) */

/* Font */
--font                 /* -apple-system, 'SF Pro Display', ... */
```

### Responsive sizing — container queries

Add `container-type: size` to the card root. Then query with `cqw`/`cqh` units.

**Grid cell dimensions:**

| Size | Approx px |
|------|-----------|
| 1 col | ~106px wide |
| 2 col | ~224px wide |
| 3 col | ~343px wide |
| 4 col | ~462px wide |
| 1 row | ~91px tall |
| 2 row | ~195px tall |

**Standard breakpoints:**

```css
/* 1-wide card */
@container (max-width: 115px) { … }

/* 2+-wide card */
@container (min-width: 200px) { … }

/* 1-tall card */
@container (max-height: 100px) { … }

/* 2+-tall card */
@container (min-height: 110px) { … }
```

**Fluid font sizing pattern (from ClockCard):**

```css
.my-value {
  font-size: clamp(2rem, 12vh, 5rem);   /* fallback */
}

@supports (font-size: 1cqh) {
  .my-value { font-size: 45cqh; }       /* modern: fills card height */
}
```

### CSS scope

Prefix ALL class names with your card id to avoid collisions:
```css
/* Good */   .my-card-title { … }
/* Bad  */   .title { … }
```

---

## Config UI pattern

Config UIs use modal CSS classes from the host (always available):

```tsx
import type { ConfigUIProps } from '../../../sdk/types'

export default function MyConfigUI({ config, onChange }: ConfigUIProps) {
  return (
    <>
      <label className="modal-label">
        Display title
        <input
          className="modal-input"
          value={config.title ?? ''}
          onChange={e => onChange('title', e.target.value)}
          placeholder="My Card"
        />
      </label>
      <label className="modal-label modal-label-check">
        <input
          type="checkbox"
          checked={config.some_option !== false}
          onChange={e => onChange('some_option', e.target.checked)}
        />
        Some option label
      </label>
    </>
  )
}
```

Available modal classes: `modal-label`, `modal-label-check`, `modal-input`, `modal-textarea`, `modal-size-row`.

---

## Publishing to the gallery

Cards go through two stages: **preview** (under development, opt-in in the gallery) and **stable** (visible to everyone by default).

### Stage 1 — Preview (use this for Phase 1–3 testing)

```json
{
  "id": "my-card",
  "name": "My Card",
  "description": "One-sentence description.",
  "author": "your-github-username",
  "version": "1.0.0",
  "status": "preview",
  "tags": ["tag1", "tag2"],
  "bundleUrl": "https://raw.githubusercontent.com/kollenss/dash-grid-cards/main/cards/my-card/dist/card.js",
  "readmeUrl": "https://raw.githubusercontent.com/kollenss/dash-grid-cards/main/cards/my-card/README.md"
}
```

Preview cards are hidden in the gallery by default. Users enable a "Show preview cards" toggle to see and install them.

### Stage 2 — Stable (after all three test phases pass)

Change `"status": "preview"` to `"status": "stable"` in `manifest.json` and push. The card becomes visible to all users without the preview toggle.

If the card has server-side logic (Node.js), also add `"serverBundleUrl"`.

---

## Known gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| `Cannot read properties of undefined (reading 'createPortal')` | `window.__dashgrid.ReactDOM` was missing | Already fixed in host — `ReactDOM` is now exposed. Import normally from `react-dom`. |
| Vite warning: "Variable absolute imports not supported" | Dynamic `import('/plugins/${id}.js')` confuses Vite's static analysis | Add `/* @vite-ignore */` inside the import — already done in App.tsx and PluginGallery.tsx |
| `git add plugins/` fails with "path is ignored" | `plugins/` is gitignored in `hassDasboard` | Don't commit it — users download from `bundleUrl` at install time |
| Overlay doesn't cover full screen / `backdrop-filter` clipping | `position: fixed` inside a `backdrop-filter` parent breaks out of the viewport | Render fullscreen overlays via `createPortal(…, document.body)` |

---

## Built-in vs plugin — when to choose what

| Built-in (in `hassDasboard`) | Plugin (in `dash-grid-cards`) |
|------------------------------|-------------------------------|
| Core utility everyone uses | Optional / niche use-case |
| Needs deep host integration | Self-contained |
| Never shown in gallery | Installable by community |

**Always ask the user before starting a new card.**
