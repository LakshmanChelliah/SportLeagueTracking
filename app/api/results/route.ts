import { timingSafeEqual } from "node:crypto"
import { revalidatePath } from "next/cache"
import { assertMatch, parseResult } from "@/lib/results"
import { readResultsFile, saveResults } from "@/lib/save-results"
import { getLeague } from "@/lib/league"

function pinOk(input: string | null) {
  const expected = process.env.ADMIN_PIN
  if (!expected || !input) return false
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PIN) {
    return Response.json({ error: "Coordinator PIN is not configured." }, { status: 503 })
  }
  if (!pinOk(request.headers.get("x-admin-pin"))) {
    return Response.json({ error: "That PIN is not right." }, { status: 401 })
  }

  const body = (await request.json()) as { action?: string; matchId?: string; result?: unknown }
  if (body.action === "unlock") return Response.json({ ok: true })

  const league = getLeague()
  if (!body.matchId || !assertMatch(league.schedule.matches, body.matchId)) {
    return Response.json({ error: "That match is not on the schedule." }, { status: 400 })
  }

  const current = await readResultsFile()
  if (body.action === "clear") {
    delete current[body.matchId]
  } else if (body.action === "save") {
    const parsed = parseResult(body.result)
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 })
    current[body.matchId] = parsed.result
  } else {
    return Response.json({ error: "Unknown action." }, { status: 400 })
  }

  try {
    const mode = await saveResults(current)
    revalidatePath("/", "layout")
    return Response.json({ ok: true, mode })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save."
    return Response.json({ error: message }, { status: 500 })
  }
}
