import { basename, extname } from "node:path"

type MetafileOutput = {
	entryPoint?: string
}

type Metafile = {
	outputs?: Record<string, MetafileOutput>
}

const normalizeOutputPath = (outputPath: string): string =>
	outputPath.replace(/\\/g, "/").replace(/^(\.\/)+/, "")

const createManifestFromMetafile = (
	metafile: Metafile,
): Record<string, string> => {
	const manifest: Record<string, string> = {}

	for (const [outputPath, outputData] of Object.entries(metafile.outputs ?? {})) {
		if (!outputData.entryPoint) {
			continue
		}

		const cleanOutputPath = normalizeOutputPath(outputPath)
		const entryBase = basename(
			outputData.entryPoint,
			extname(outputData.entryPoint),
		)
		const outputExt = extname(cleanOutputPath)
		const key = `${entryBase}${outputExt}`

		manifest[key] = cleanOutputPath
	}

	return manifest
}

export const writeManifestFromMetaFile = async (
	metafilePath: string,
	manifestPath: string,
): Promise<void> => {
	const metaRaw = await Bun.file(metafilePath).text()
	const metafile = JSON.parse(metaRaw) as Metafile
	const manifest = createManifestFromMetafile(metafile)

	await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}
