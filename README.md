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

`/admin` is the coordinator page. Set a PIN before using it:

```bash
ADMIN_PIN=choose-a-pin npm run dev
```

Without `GITHUB_TOKEN`, saving writes `data/results.json` on this machine. On Vercel the disk is read-only, so production saves commit that file to GitHub and the site redeploys.

| Variable | Purpose |
| --- | --- |
| `ADMIN_PIN` | Coordinator PIN. Never shipped to the browser. |
| `GITHUB_TOKEN` | Fine-grained token with contents write on this repo. |
| `GITHUB_REPO` | `owner/name`, for example `LakshmanChelliah/SportLeagueTracking`. |
| `GITHUB_BRANCH` | Branch Vercel deploys. Defaults to `main`. |

## Rules the board follows

- One point per game won.
- Rank is wins, then point differential, then points scored.
- A game can end at 10 minutes to the hour. Tied games award no point.
- A forfeit (four players or fewer) is stored as 21–0, 21–0, 21–0.
