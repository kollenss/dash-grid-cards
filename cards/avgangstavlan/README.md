# Avgångstavlan (Västtrafik)

Real-time public transport departures from any Västtrafik stop. Shows minutes until departure with color-coded line badges, transport mode icons, and cancellation status.

## Requirements

A free Västtrafik developer account at [developer.vasttrafik.se](https://developer.vasttrafik.se). Create an app and copy the Client ID, Client Secret and Authentication Key into Dash Grid Settings → Integrations.

## Configuration

| Option | Description |
|--------|-------------|
| Stop area | Search for and select your stop |
| Title | Custom label shown on the card |
| Max departures | How many departures to show (default 8) |
| Warn when less than | Highlight departures below this many minutes |
| Hide departures leaving now | Filter out departures at 0 min |

## Features

- Color-coded line badges matching Västtrafik's official line colors
- Live countdown in minutes, refreshed every 10 seconds
- Cancellation and delay indicators
- Responsive layout — adapts from 1×1 minimal to full multi-row grid
- **Click any departure** to see the full route with all upcoming stops and arrival times

## Changelog

### 1.1.0 — 2026-04-20
- Click a departure row to open a stop list modal showing the full route
- Modal shows up to 3 stops before your configured stop (for context), then all remaining stops
- Each stop shows clock time and relative minutes from your departure stop
- Stops before your stop are dimmed

### 1.0.0
- Initial release
