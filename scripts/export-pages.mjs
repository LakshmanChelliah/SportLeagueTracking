import { spawn } from "node:child_process"
import { rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const api = path.join(root, "app", "api")
const stash = path.join("/tmp", "gdra-api-stash")

await rm(stash, { recursive: true, force: true })
await rename(api, stash)

const child = spawn("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_STATIC: "1" },
})

let code = 1
try {
  code = await new Promise((resolve) => {
    child.on("exit", (status) => resolve(status ?? 1))
  })
  if (code === 0) {
    await writeFile(path.join(root, "out", ".nojekyll"), "")
  }
} finally {
  await rename(stash, api)
}

process.exit(code)
