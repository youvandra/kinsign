/**
 * The director (scenario and call controls) and the phone talk over a
 * BroadcastChannel, so they stay in sync on one page, across the stage's
 * frames, or in separate tabs. Language changes travel the same way.
 */
import { useCallback, useEffect, useRef } from 'react'

export interface CallState {
  onCall: boolean
  minutes: number
  callerSaved: boolean
  screenCaptured: boolean
  remoteControlApp: boolean
  duress: boolean
}

export const NO_CALL: CallState = { onCall: false, minutes: 0, callerSaved: false, screenCaptured: false, remoteControlApp: false, duress: false }

export type SceneMessage =
  | { type: 'scene'; payee: string; amount: number; call: CallState }
  | { type: 'call'; call: CallState }
  | { type: 'state'; call: CallState }
  | { type: 'lang'; lang: string }

const CHANNEL = 'kinsign-scene'

/** Subscribes to the channel; returns a function that posts to every other listener. */
export function useSceneChannel(onMessage: (m: SceneMessage) => void): (m: SceneMessage) => void {
  const channel = useRef<BroadcastChannel>()
  const handler = useRef(onMessage)
  useEffect(() => {
    handler.current = onMessage
  })
  useEffect(() => {
    const c = new BroadcastChannel(CHANNEL)
    c.onmessage = (e: MessageEvent<SceneMessage>) => handler.current(e.data)
    channel.current = c
    return () => c.close()
  }, [])
  return useCallback((m: SceneMessage) => channel.current?.postMessage(m), [])
}
