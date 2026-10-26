export type TeamId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type Venue = {
  id: string
  name: string
  address?: string
}

export type Match = {
  id: string
  date: string
  time: "18:00" | "19:00" | "20:00" | "21:00"
  court: 1 | 2
  venue?: string
  home?: TeamId
  away?: TeamId
  /** Playoff or open-gym slot whose teams are not assigned yet. */
  label?: string
  note?: string
  /** Local end time when the slot runs longer than an hour. */
  until?: "22:00"
}

export type ScheduleFile = {
  league: string
  season: string
  gym: string
  timezone: string
  through: string
  teams: TeamId[]
  venues: Venue[]
  matches: Match[]
}

export type GameScore = [number, number]

export type Result = {
  games: [GameScore, GameScore, GameScore]
  forfeit?: "home" | "away"
}

export type ResultsFile = Record<string, Result>

export type Rule = { n: string; title: string; body: string }
export type Playoff = { week: string; name: string; series: string }

export type RulesFile = {
  intro: string
  rules: Rule[]
  playoffs: Playoff[]
}

export type Standing = {
  team: TeamId
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  diff: number
  form: Array<"W" | "L" | "T">
  rank: number
}

export type LeagueData = {
  schedule: ScheduleFile
  results: ResultsFile
  rules: RulesFile
}
