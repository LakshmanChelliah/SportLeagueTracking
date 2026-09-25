import { readFileSync } from "node:fs"
import path from "node:path"
import type { LeagueData, ResultsFile, RulesFile, ScheduleFile } from "@/lib/types"

function readJson<T>(name: string): T {
  const file = path.join(process.cwd(), "data", name)
  return JSON.parse(readFileSync(file, "utf8")) as T
}

export function getLeague(): LeagueData {
  return {
    schedule: readJson<ScheduleFile>("schedule.json"),
    results: readJson<ResultsFile>("results.json"),
    rules: readJson<RulesFile>("rules.json"),
  }
}
