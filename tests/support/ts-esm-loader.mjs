import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

function buildCandidates(specifier, parentURL) {
  const candidates = []

  if (specifier.startsWith('@/')) {
    const basePath = path.resolve(process.cwd(), specifier.slice(2))
    candidates.push(
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.js`,
      path.join(basePath, 'index.ts'),
      path.join(basePath, 'index.tsx'),
      path.join(basePath, 'index.js')
    )
    return candidates
  }

  if (!specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('/')) {
    return candidates
  }

  const parentPath = parentURL ? fileURLToPath(parentURL) : process.cwd()
  const resolvedBase = specifier.startsWith('/')
    ? specifier
    : path.resolve(path.dirname(parentPath), specifier)

  candidates.push(
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    `${resolvedBase}.js`,
    path.join(resolvedBase, 'index.ts'),
    path.join(resolvedBase, 'index.tsx'),
    path.join(resolvedBase, 'index.js')
  )

  return candidates
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve)
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
      throw error
    }

    for (const candidate of buildCandidates(specifier, context.parentURL)) {
      if (existsSync(candidate)) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidate).href,
        }
      }
    }

    throw error
  }
}
