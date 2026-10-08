/** Repository root: the directory holding contracts/, federation/ and infra/. */
export const REPO_ROOT = new URL('../../../', import.meta.url)

export const repoPath = (relative: string) => new URL(relative, REPO_ROOT)
