# GD RA Volleyball

Schedule, standings, and score entry for the GD RA Volleyball League. Double Gym, eight teams, Wednesday nights from October 7 through December 2, 2026.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pick your team in the header. That choice is remembered in a cookie and, on a phone, limits Home, Schedule, and Team to your matches. Standings always lists every team.

The public board is [https://lakshmanchelliah.github.io/SportLeagueTracking/](https://lakshmanchelliah.github.io/SportLeagueTracking/). Publish an update with `npm run build:pages`, then commit the `out/` files to the branch GitHub Pages serves. That host is static, so score entry stays on the coordinator server described below.

## Scores

`/admin` is the coordinator page. The coordinator enters the three game scores for a match, including nights already played. Set a PIN before using it:

```bash
ADMIN_PIN=choose-a-pin npm run dev
```

Without `GITHUB_TOKEN`, saving writes `data/results.json` on this machine, and the running app reads that file from `/api/results`. The public board is static, so score entry runs on a Node host for this app (Vercel, or any host that can run `next start`). That host reads the current `data/results.json` from GitHub, merges the one match, and commits the file. Home, schedule, standings, and team then load that file, so points update without republishing the HTML.

GitHub Pages cannot check the PIN. After the coordinator host has a URL, rebuild the public site once with `NEXT_PUBLIC_COORDINATOR_URL` set to that origin. The published pages post scores there and read results from the raw `main` copy of `data/results.json`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `ADMIN_PIN` | Coordinator host | Coordinator PIN. Never shipped to the browser. |
| `GITHUB_TOKEN` | Coordinator host | Fine-grained token with contents write on this repo. |
| `GITHUB_REPO` | Coordinator host | `owner/name`, for example `LakshmanChelliah/SportLeagueTracking`. |
| `GITHUB_BRANCH` | Coordinator host | Branch that stores `data/results.json`. Defaults to `main`. |
| `NEXT_PUBLIC_COORDINATOR_URL` | Pages build | Origin of the coordinator host, with no path. The public form posts to `/api/results` on it. |
| `NEXT_PUBLIC_RESULTS_URL` | Pages build | Optional. Overrides the raw results file the public board reads. |

## Rules the board follows

- One point per game won.
- Rank is wins, then point differential, then points scored.
- A game can end at 10 minutes to the hour. Tied games award no point.
- A forfeit (four players or fewer) is stored as 21–0, 21–0, 21–0.
