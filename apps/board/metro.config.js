/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Force Metro to use apps/board as the project root (not monorepo root)
// This prevents pnpm workspace auto-detection from breaking the entry point
config.projectRoot = projectRoot
config.watchFolders = [projectRoot]

// pnpm: resolve from both app and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = config
