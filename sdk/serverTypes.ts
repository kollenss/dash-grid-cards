export interface PluginRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  handler: (req: any, reply: any) => Promise<any>
}

export interface ServerPlugin {
  routes: PluginRoute[]
}
