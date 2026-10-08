/** Runtime settings, all from the environment with demo defaults. */
export const config = {
  port: Number(process.env.PORT ?? 8620),
  /** Used when KINSIGN_RPC is unset: the API starts its own anvil on this port. */
  anvilPort: Number(process.env.KINSIGN_ANVIL_PORT ?? 8548),
  /** How long the circle has before a hold can go to the review desk. */
  responseWindowSeconds: 30n * 60n,
  /** The built web app this API serves in production. */
  webDist: new URL('../../web/dist/', import.meta.url),
} as const
