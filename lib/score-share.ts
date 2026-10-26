export type ShareGame = {
  label: string
  left: number
  right: number
  played: boolean
}

export function scoreShareText(leftName: string, rightName: string, when: string, games: ShareGame[]) {
  const lines = games.map((game) =>
    game.played
      ? `${game.label}: ${leftName} ${game.left}, ${rightName} ${game.right}`
      : `${game.label}: not played`,
  )
  return [`${leftName} vs ${rightName}`, when, ...lines].join("\n")
}

export function drawScoreCard(
  canvas: HTMLCanvasElement,
  leftName: string,
  rightName: string,
  when: string,
  games: ShareGame[],
) {
  const width = 1080
  const height = 1350
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.fillStyle = "#09090b"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#e8572a"
  ctx.fillRect(0, 0, width, 16)
  ctx.fillStyle = "#e8572a"
  ctx.font = "600 28px Arial, sans-serif"
  ctx.fillText("LIVE SCORE", 72, 110)
  ctx.fillStyle = "#a1a1aa"
  ctx.font = "28px Arial, sans-serif"
  ctx.fillText(when, 72, 160)

  const leftLines = wrapText(ctx, leftName.toUpperCase(), 420, "700 54px Arial, sans-serif")
  const rightLines = wrapText(ctx, rightName.toUpperCase(), 420, "700 54px Arial, sans-serif")
  ctx.fillStyle = "#f4f4f5"
  ctx.font = "700 54px Arial, sans-serif"
  ctx.textAlign = "left"
  leftLines.forEach((line, index) => ctx.fillText(line, 72, 280 + index * 62))
  ctx.textAlign = "right"
  rightLines.forEach((line, index) => ctx.fillText(line, width - 72, 280 + index * 62))
  ctx.textAlign = "left"

  games.forEach((game, index) => {
    const y = 560 + index * 180
    ctx.fillStyle = "#111113"
    roundRect(ctx, 72, y, width - 144, 150, 24)
    ctx.fillStyle = "#71717a"
    ctx.font = "600 28px Arial, sans-serif"
    ctx.fillText(game.label.toUpperCase(), 108, y + 52)
    ctx.fillStyle = "#f4f4f5"
    const score = game.played ? `${game.left}  –  ${game.right}` : "Not played"
    ctx.font = game.played ? "700 72px Arial, sans-serif" : "600 40px Arial, sans-serif"
    ctx.fillText(score, 108, y + 118)
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
  ctx.font = font
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

export function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Could not make the picture."))
    }, "image/png")
  })
}
