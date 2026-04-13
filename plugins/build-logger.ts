/// <reference types="bun-types" />

import {statSync} from "node:fs"
import {relative} from "node:path"

type BuildLog = {
  level?: string
  message?: string
}

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
} as const

const colorize = (color: keyof typeof colors, text: string) =>
  `${colors[color]}${text}${colors.reset}`

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "n/a"
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 ** 2).toFixed(2)} MB`
}

const normalizeLogMessage = (log: unknown): string => {
  if (typeof log === "string") {
    return log
  }

  if (log && typeof log === "object") {
    const maybeMessage = (log as BuildLog).message
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage
    }

    try {
      return JSON.stringify(log)
    } catch {
      return "Unknown build log"
    }
  }

  return "Unknown build log"
}

const getLogLevel = (log: unknown): string => {
  if (!log || typeof log !== "object") {
    return ""
  }

  const level = (log as BuildLog).level

  return typeof level === "string" ? level.toLowerCase() : ""
}

export const logBuildDiagnostics = (buildResult: Bun.BuildOutput): void => {
  const logs = buildResult.logs ?? []
  const warningLogs = logs.filter((log) => getLogLevel(log).includes("warn"))
  const errorLogs = logs.filter((log) => getLogLevel(log).includes("error"))

  if (warningLogs.length > 0) {
    console.warn(colorize("yellow", `Warnings (${warningLogs.length}):`))
    for (const warning of warningLogs) {
      console.warn(colorize("yellow", `- ${normalizeLogMessage(warning)}`))
    }
  }

  if (errorLogs.length > 0) {
    console.error(colorize("red", `Errors (${errorLogs.length}):`))
    for (const error of errorLogs) {
      console.error(colorize("red", `- ${normalizeLogMessage(error)}`))
    }
  }
}

export const logBuildSuccess = (buildResult: Bun.BuildOutput): void => {
  const builtFiles = buildResult.outputs
    .map((output) => {
      const normalizedPath = relative(process.cwd(), output.path).replace(
        /\\/g,
        "/",
      )
      const fileSize = statSync(output.path).size

      return {
        path: normalizedPath,
        size: fileSize,
      }
    })
    .sort((left, right) => left.path.localeCompare(right.path))

  console.log(colorize("green", `Build OK (${builtFiles.length} files)`))
  for (const file of builtFiles) {
    console.log(colorize("cyan", `- ${file.path} (${formatBytes(file.size)})`))
  }
}
