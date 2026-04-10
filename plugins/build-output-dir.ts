import { mkdir, rm } from "node:fs/promises"

export const resetBuildOutputDir = async (outdir: string): Promise<void> => {
	// Remove stale hashed chunks from previous builds.
	await rm(outdir, { recursive: true, force: true })
	await mkdir(outdir, { recursive: true })
}
