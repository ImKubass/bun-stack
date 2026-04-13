/// <reference types="bun-types" />

import path from "node:path"
import {
  BOOTSTRAP_SOURCE_SCSS_RELATIVE_PATH,
  getBootstrapPrebuiltCssPath,
  getBootstrapSourceScssPath,
} from "./plugins/bootstrap-prebuilt"

const sourceScss = getBootstrapSourceScssPath()
const outputCss = getBootstrapPrebuiltCssPath()

const sass = await import("sass")

const result = await sass.compileAsync(sourceScss, {
  style: "compressed",
  quietDeps: true,
  loadPaths: [
    path.dirname(sourceScss),
    path.resolve(process.cwd(), "node_modules"),
  ],
})

const banner = `/* Generated from ${BOOTSTRAP_SOURCE_SCSS_RELATIVE_PATH}. Run: bun run bootstrap:build */\n`
await Bun.write(outputCss, `${banner}${result.css}`)

const sizeBytes = Buffer.byteLength(result.css)
const sizeKb = (sizeBytes / 1024).toFixed(1)
console.log(
  `Bootstrap CSS prebuilt: ${path.relative(process.cwd(), outputCss)} (${sizeKb} KB)`,
)
