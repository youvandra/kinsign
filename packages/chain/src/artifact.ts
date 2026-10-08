import { readFileSync } from 'node:fs'
import type { Abi } from 'viem'
import type { Hex } from '@kinsign/protocol'
import { repoPath } from './paths.ts'

export interface Artifact {
  abi: Abi
  bytecode: Hex
}

/** Reads a Foundry build artifact. Run `forge build` in contracts/ first. */
export function loadArtifact(name: string): Artifact {
  const file = repoPath(`contracts/out/${name}.sol/${name}.json`)
  const json = JSON.parse(readFileSync(file, 'utf8')) as { abi: Abi; bytecode: { object: Hex } }
  return { abi: json.abi, bytecode: json.bytecode.object }
}

export const RELEASE_CONTRACT = 'KinsignRelease'
