import { timingSafeEqual } from "node:crypto"
import { revalidatePath } from "next/cache"
import { getLeague } from "@/lib/league"
import { assertMatch, parseResult } from "@/lib/results"
import { readStoredResults, updateStoredResults } from "@/lib/save-results"
import type { ResultsFile } from "@/lib/types"

export const dynamic = "force-dynamic"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-pin",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store",
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders })
}

function pinOk(input: string | null) {
  const expected = process.env.ADMIN_PIN
  if (!expected || !input) return false
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

async function store(change: (current: ResultsFile) => ResultsFile) {
  try {
    const mode = await updateStoredResults(change)
    revalidatePath("/", "layout")
    return json({ ok: true, mode })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save."
    return json({ error: message }, 500)
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    const results = await readStoredResults()
    return json(results)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read scores."
    return json({ error: message }, 500)
  }
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PIN) {
    return json({ error: "Coordinator PIN is not configured." }, 503)
  }
  if (!pinOk(request.headers.get("x-admin-pin"))) {
    return json({ error: "That PIN is not right." }, 401)
  }

  const body = (await request.json()) as { action?: string; matchId?: string; result?: unknown }
  if (body.action === "unlock") return json({ ok: true })

  const matchId = body.matchId
  const league = getLeague()
  if (!matchId || !assertMatch(league.schedule.matches, matchId)) {
    return json({ error: "That match is not on the schedule." }, 400)
  }

  if (body.action === "clear") {
    return store((current) => {
      const next = { ...current }
      delete next[matchId]
      return next
    })
  }

  if (body.action === "save") {
    const parsed = parseResult(body.result)
    if ("error" in parsed) return json({ error: parsed.error }, 400)
    const result = parsed.result
    return store((current) => ({ ...current, [matchId]: result }))
  }

  return json({ error: "Unknown action." }, 400)
}
