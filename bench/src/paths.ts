import { repoPath } from '@kinsign/chain'

/** Benchmark outputs, committed so every published number has a file behind it. */
export const RESULTS_DIR = new URL('../results/', import.meta.url)

/** Where the FATE job reads its CSVs and writes its predictions, per operator setting. */
export const fateDataDir = (setting: string) => repoPath(`federation/data/${setting}/`)
export const fateOutDir = (setting: string) => repoPath(`federation/out/${setting}/`)
