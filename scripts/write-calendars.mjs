import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildCalendar } from "../lib/ics.ts"
import { TEAMS } from "../lib/teams.ts"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const schedule = JSON.parse(await readFile(join(root, "data/schedule.json"), "utf8"))
const dir = join(root, "public", "calendars")

await mkdir(dir, { recursive: true })
for (const team of TEAMS) {
  await writeFile(join(dir, `team-${team}.ics`), buildCalendar(schedule.matches, team))
}
