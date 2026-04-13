import path from "node:path"

export const BOOTSTRAP_SOURCE_SCSS_RELATIVE_PATH =
  "src/scss/vendors/v-bootsrap.scss"
export const BOOTSTRAP_PREBUILT_CSS_RELATIVE_PATH =
  "src/scss/vendors/bootstrap.prebuilt.css"

export const getBootstrapSourceScssPath = (): string =>
  path.resolve(BOOTSTRAP_SOURCE_SCSS_RELATIVE_PATH)

export const getBootstrapPrebuiltCssPath = (): string =>
  path.resolve(BOOTSTRAP_PREBUILT_CSS_RELATIVE_PATH)

export const ensureBootstrapPrebuiltCssExists = async (): Promise<void> => {
  const prebuiltBootstrapCssPath = getBootstrapPrebuiltCssPath()

  if (await Bun.file(prebuiltBootstrapCssPath).exists()) {
    return
  }

  console.error(
    `Missing prebuilt Bootstrap CSS: ${BOOTSTRAP_PREBUILT_CSS_RELATIVE_PATH}`,
  )
  console.error("Run: bun run bootstrap:build")
  process.exit(1)
}
