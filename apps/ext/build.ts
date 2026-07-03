// OfferLens Extension Build Script
// Transpiles TypeScript source files to JavaScript for Chrome extension loading

import ts from "typescript"

const SRC_DIR = new URL("src/", import.meta.url)
const BUILD_DIR = new URL("build/", import.meta.url)
const SOURCES = ["background.ts", "content.ts", "sidepanel.ts"]

await Deno.mkdir(BUILD_DIR, { recursive: true })
console.log("Building extension TS → JS...")

for (const src of SOURCES) {
  const srcPath = new URL(src, SRC_DIR)
  const code = await Deno.readTextFile(srcPath)

  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: false,
      removeComments: false,
    },
  })

  const outName = src.replace(/\.ts$/, ".js")
  const outPath = new URL(outName, BUILD_DIR)
  await Deno.writeTextFile(outPath, result.outputText)
  console.log(`  ✓ ${src} → build/${outName}`)
}

console.log("Build complete.")
