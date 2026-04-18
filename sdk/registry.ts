import type { CardDefinition } from './types'

export function registerCard(def: CardDefinition): void {
  const g = (window as any).__dashgrid
  if (!g?.registry) {
    console.error('[Dash Grid] Plugin tried to register before app was ready:', def.type)
    return
  }
  g.registry.register(def)
}
