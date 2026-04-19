import type { ServerPlugin } from '../../../sdk/serverTypes'

const plugin: ServerPlugin = {
  routes: [
    {
      method: 'GET',
      path: '/ical',
      handler: async (req: any, reply: any) => {
        const { url } = req.query as { url?: string }
        if (!url) {
          reply.code(400)
          return { error: 'Missing url parameter' }
        }

        const decoded = decodeURIComponent(url)

        // Only allow https:// to avoid SSRF against local services
        if (!decoded.startsWith('https://')) {
          reply.code(400)
          return { error: 'Only https:// URLs are allowed' }
        }

        try {
          const res = await fetch(decoded, {
            headers: { 'User-Agent': 'DashGrid/1.0 calendar-card' },
            signal: AbortSignal.timeout(10_000),
          })
          if (!res.ok) {
            reply.code(502)
            return { error: `ICS fetch failed: HTTP ${res.status}` }
          }
          const ics = await res.text()
          return { ics }
        } catch (e: any) {
          reply.code(502)
          return { error: e.message ?? 'ICS fetch failed' }
        }
      },
    },
  ],
}

export default plugin
