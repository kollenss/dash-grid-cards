const c = {
  routes: [
    {
      method: "GET",
      path: "/ical",
      handler: async (s, t) => {
        const { url: r } = s.query;
        if (!r)
          return t.code(400), { error: "Missing url parameter" };
        const a = decodeURIComponent(r);
        if (!a.startsWith("https://"))
          return t.code(400), { error: "Only https:// URLs are allowed" };
        try {
          const e = await fetch(a, {
            headers: { "User-Agent": "DashGrid/1.0 calendar-card" },
            signal: AbortSignal.timeout(1e4)
          });
          return e.ok ? { ics: await e.text() } : (t.code(502), { error: `ICS fetch failed: HTTP ${e.status}` });
        } catch (e) {
          return t.code(502), { error: e.message ?? "ICS fetch failed" };
        }
      }
    }
  ]
};
export {
  c as default
};
