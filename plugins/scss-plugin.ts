import fg from "fast-glob"
import path from "node:path"
import {pathToFileURL} from "node:url"

const GLOB_CHARS_RE = /[*?\[\]{}!]/
const USE_RE = /^(\s*@use\s+["'])([^"']+)(["'])(.*)$/

const toPosix = (value: string): string => value.split(path.sep).join("/")

const toUsePath = (fromFile: string, toFile: string): string => {
  const relative = toPosix(path.relative(path.dirname(fromFile), toFile))
  return relative.startsWith(".") ? relative : `./${relative}`
}

const expandUseGlobs = async (filePath: string): Promise<string> => {
  const source = await Bun.file(filePath).text()
  const lines = source.split("\n")
  const output: string[] = []

  for (const line of lines) {
    const match = line.match(USE_RE)

    if (!match) {
      output.push(line)
      continue
    }

    const [, rawPrefix, rawImportPath, rawQuote, rawSuffix] = match
    const prefix = rawPrefix ?? ""
    const importPath = rawImportPath ?? ""
    const quote = rawQuote ?? '"'
    const suffix = rawSuffix ?? ""

    if (!GLOB_CHARS_RE.test(importPath)) {
      output.push(line)
      continue
    }

    const matches = (await fg(importPath, {
      cwd: path.dirname(filePath),
      absolute: true,
      onlyFiles: true,
      followSymbolicLinks: false,
    })) as string[]

    const scssMatches = matches
      .filter((candidate) => candidate.endsWith(".scss"))
      .filter((candidate) => path.resolve(candidate) !== path.resolve(filePath))
      .sort((left, right) => left.localeCompare(right))

    if (!scssMatches.length) {
      output.push(line)
      continue
    }

    for (const scssFile of scssMatches) {
      output.push(`${prefix}${toUsePath(filePath, scssFile)}${quote}${suffix}`)
    }
  }

  return output.join("\n")
}

export const scssPlugin: Bun.BunPlugin = {
  name: "scss-plugin",
  setup(build) {
    build.onLoad({filter: /\.scss$/}, async ({path: filePath}) => {
      const sass = await import("sass")
      const expandedSource = await expandUseGlobs(filePath)
      const result = await sass.compileStringAsync(expandedSource, {
        url: pathToFileURL(filePath),
        style: "compressed",
        quietDeps: true,
        loadPaths: [
          path.dirname(filePath),
          path.resolve(process.cwd(), "node_modules"),
        ],
      })

      return {
        contents: result.css,
        loader: "css",
      }
    })
  },
}
