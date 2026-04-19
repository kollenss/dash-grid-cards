# Dash Grid — Card Development Guide

Reference for building plugin cards for Dash Grid. Written for both human developers and AI assistants (Claude Code). Read this before creating a new card.

---

## Architecture overview

```
dash-grid-cards/
├── sdk/
│   ├── registry.ts       ← registerCard() — call this to add a card to the app
│   ├── types.ts          ← CardDefinition, CardProps, ConfigUIProps, IntegrationDef
│   └── serverTypes.ts    ← ServerPlugin, PluginRoute (for server-side plugins)
├── cards/
│   └── my-card/
│       ├── src/
│       │   ├── index.tsx              ← entry: imports card + registers it
│       │   ├── MyCard.tsx             ← the React component shown in the grid
│       │   ├── MyCard.css             ← styles (injected via ?inline import)
│       │   ├── MyCardConfigUI.tsx     ← optional: config fields in the Add Card dialog
│       │   └── server.ts             ← optional: server-side routes (see below)
│       ├── dist/
│       │   ├── card.js               ← built client bundle (commit this)
│       │   └── server.js             ← built server bundle (commit this if used)
│       ├── vite.config.ts            ← client bundle config
│       ├── vite.config.server.ts     ← server bundle config (only if server.ts exists)
│       ├── package.json
│       └── tsconfig.json
└── manifest.json                     ← registry of all available cards
```

A card is two things:
- **Client bundle** (`card.js`) — a JavaScript IIFE that runs in the browser and registers the card into the app's registry via `window.__dashgrid.registry`
- **Server bundle** (`server.js`, optional) — an ES module loaded by Node.js that adds server-side route handlers

---

## Step-by-step: create a new card

### 1. Scaffold the folder

Copy `cards/avgangstavlan/` as a starting point. Rename everything.

Minimum file set:
```
cards/my-card/
├── src/index.tsx
├── src/MyCard.tsx
├── src/MyCard.css
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### 2. package.json

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
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}
```

If you add a `server.ts`, extend `build` to also build the server bundle and add `vite.config.server.ts` (see below).

### 3. vite.config.ts — critical settings

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({ jsxRuntime: 'classic' }),  // ← REQUIRED. 'automatic' breaks the IIFE build.
  ],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['iife'],
      name: 'DGCard_myCard',           // ← unique global name, camelCase
      fileName: () => 'card.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'window.__dashgrid.React',      // ← REQUIRED. Not 'React'.
          'react-dom': 'window.__dashgrid.ReactDOM',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
```

**Why `jsxRuntime: 'classic'`?**
The app exposes React via `window.__dashgrid.React`. The classic JSX transform uses `React.createElement()` which finds this global. The automatic transform imports from `react/jsx-runtime` instead, which breaks in an IIFE context.

**Why `window.__dashgrid.React` and not `'React'`?**
The app does not expose React as a bare `window.React` global. It uses the namespaced `window.__dashgrid` object to avoid conflicts.

### 4. index.tsx — entry file

```tsx
import { registerCard } from '../../../sdk/registry'
import MyCard from './MyCard'
import MyCardConfigUI from './MyCardConfigUI'
import cardCss from './MyCard.css?inline'

// Inject CSS into the document head (guard against double-injection)
;(function injectStyles() {
  if (document.querySelector('style[data-card="my-card"]')) return
  const style = document.createElement('style')
  style.setAttribute('data-card', 'my-card')
  style.textContent = cardCss
  document.head.appendChild(style)
})()

registerCard({
  type: 'my-card',             // unique id — use kebab-case
  label: 'My Card',
  icon: '✨',
  group: 'My group',
  defaultSize: [2, 2],
  minSize: [1, 1],
  needsEntity: false,
  component: MyCard,
  configUI: MyCardConfigUI,    // optional
})
```

### 5. MyCard.tsx — the card component

```tsx
import type { CardProps } from '../../../sdk/types'  // optional, for typing

interface Config {
  title?: string
}

export default function MyCard({ config, colSpan, rowSpan }: { config: Config; colSpan: number; rowSpan: number }) {
  return (
    <div className="glass-card my-card">
      <div className="card-label">{config.title ?? 'My Card'}</div>
      {/* content */}
    </div>
  )
}
```

**Always use `glass-card` as the outermost class.** This gives the card the glassmorphism look that adapts to all themes.

### 6. CSS

```css
/* Use CSS custom properties — never hardcode colors */
.my-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}
```

Available CSS custom properties from the design system:

| Property | Description |
|---|---|
| `var(--glass-bg)` | Glassmorphism background |
| `var(--glass-border)` | Card border |
| `var(--radius-card)` | Corner radius |
| `var(--color-text)` | Primary text (white) |
| `var(--color-text-mid)` | Semi-transparent text |
| `var(--color-text-dim)` | Dimmed text, used for labels |
| `var(--color-accent)` | Accent color (default: cyan #5ac8fa) |
| `var(--hb-status-error)` | Error red |
| `var(--hb-status-warning)` | Warning yellow |

### 7. ConfigUI — config fields in the Add Card dialog

```tsx
import type { ConfigUIProps } from '../../../sdk/types'

export default function MyCardConfigUI({ config, onChange }: ConfigUIProps) {
  return (
    <>
      <label className="modal-label">
        Title
        <input
          className="modal-input"
          value={config.title ?? ''}
          onChange={e => onChange('title', e.target.value)}
          placeholder="My card"
        />
      </label>
    </>
  )
}
```

| CSS class | Usage |
|---|---|
| `modal-label` | `<label>` wrapper |
| `modal-label-check` | `<label>` for a checkbox row |
| `modal-input` | `<input>`, `<select>`, `<textarea>` |

### 8. Build and commit

```bash
cd cards/my-card
npm install
npm run build
```

Always commit the `dist/` folder. The app installs cards by downloading `dist/card.js` from GitHub raw.

---

## Server-side plugin routes

Use a server plugin when your card needs to:
- Fetch from an API that doesn't support CORS (e.g. ICS calendar feeds)
- Handle OAuth token management
- Store secrets or make requests that must not go through the browser

### When NOT to use a server plugin

If the external API supports CORS (most modern REST APIs, including Google Calendar JSON API), fetch directly from the card component — no server plugin needed.

### How it works

When a card with a server bundle is installed, Dash Grid downloads `server.js` and loads it into Node.js. The server exposes a dispatcher at:

```
/api/plugin-rpc/{card-id}/{your-path}
```

Your card calls this URL from the browser. The dispatcher finds the matching route handler in your server plugin and calls it.

### server.ts

```ts
import type { ServerPlugin } from '../../../sdk/serverTypes'

const plugin: ServerPlugin = {
  routes: [
    {
      method: 'GET',
      path: '/data',
      handler: async (req, reply) => {
        const { param } = req.query as { param?: string }
        if (!param) {
          reply.code(400)
          return { error: 'Missing param' }
        }
        const res = await fetch(`https://api.example.com/data?q=${param}`, {
          signal: AbortSignal.timeout(10_000),
        })
        return res.json()
      },
    },
  ],
}

export default plugin
```

**Security rule:** only allow `https://` URLs when proxying external requests. This prevents SSRF attacks against internal network services.

### vite.config.server.ts

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/server.ts',
      formats: ['es'],           // ← ESM, not IIFE
      fileName: () => 'server.js',
    },
    outDir: 'dist',
    emptyOutDir: false,          // ← don't wipe card.js
    target: 'node18',
    rollupOptions: {
      external: ['fs', 'path', 'url', 'http', 'https', 'crypto', 'stream', 'buffer'],
    },
  },
})
```

### Calling from the card component

```ts
const res = await fetch(`/api/plugin-rpc/my-card/data?param=${encodeURIComponent(value)}`)
const data = await res.json()
```

### package.json build script with server

```json
"build": "vite build && vite build --config vite.config.server.ts"
```

---

## manifest.json — registering the card

Add an entry to `manifest.json` at the root of this repo:

```json
{
  "id": "my-card",
  "name": "My Card",
  "description": "One sentence description shown in the gallery.",
  "author": "your-github-username",
  "version": "1.0.0",
  "tags": ["category", "keyword"],
  "bundleUrl": "https://raw.githubusercontent.com/kollenss/dash-grid-cards/main/cards/my-card/dist/card.js",
  "serverBundleUrl": "https://raw.githubusercontent.com/kollenss/dash-grid-cards/main/cards/my-card/dist/server.js",
  "readmeUrl": "https://raw.githubusercontent.com/kollenss/dash-grid-cards/main/cards/my-card/README.md"
}
```

Omit `serverBundleUrl` if the card has no server plugin. Omit `readmeUrl` if there's no README.

---

## Common mistakes (learned the hard way)

| Mistake | Symptom | Fix |
|---|---|---|
| `jsxRuntime: 'automatic'` in vite.config | Card installs but never appears in the Add Card dialog | Use `jsxRuntime: 'classic'` |
| `globals: { react: 'React' }` | Same as above — React is undefined at runtime | Use `globals: { react: 'window.__dashgrid.React' }` |
| Server route path conflicts | `/api/plugins/manifest` stops working | Use `/api/plugin-rpc/` prefix, never `/api/plugins/` |
| `?v=timestamp` on `file://` import URL | Server plugin silently fails to load | Use `pathToFileURL(path).href` without query params |
| Parser requires SUMMARY | Events without titles are dropped silently | Make SUMMARY optional with a fallback string |
| `emptyOutDir: true` in server vite config | Server build wipes `card.js` | Set `emptyOutDir: false` for the server config |
| Forgetting to commit `dist/` | Gallery installs old bundle from GitHub | Always build + commit dist before pushing |

---

## Design patterns for responsive cards

Cards receive `colSpan` and `rowSpan` props. Use them to adapt the layout:

```tsx
export default function MyCard({ config, colSpan, rowSpan }: Props) {
  const compact = rowSpan <= 2
  const narrow  = colSpan <= 2

  return (
    <div className={`glass-card my-card${compact ? ' my-card--compact' : ''}`}>
      {!compact && <div className="card-label">{config.title}</div>}
      {/* ... */}
    </div>
  )
}
```

---

## Pre-publish checklist

- [ ] `type` in `registerCard` is unique and uses kebab-case
- [ ] `vite.config.ts` uses `jsxRuntime: 'classic'` and correct `globals`
- [ ] `glass-card` is the outermost element
- [ ] No hardcoded hex colors — only CSS custom properties
- [ ] Card handles missing/empty `config` values gracefully
- [ ] CSS is injected via `?inline` import in `index.tsx` (with double-injection guard)
- [ ] Server plugin (if any) only allows `https://` in proxied URLs
- [ ] `dist/card.js` (and `dist/server.js`) are built and committed
- [ ] `manifest.json` updated with correct URLs
- [ ] Card has been tested: install from gallery, add to dashboard, configure
