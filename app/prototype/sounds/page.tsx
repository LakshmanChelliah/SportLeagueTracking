import type { Metadata } from "next"
import { SoundBooth } from "@/components/prototype/sound-booth"

export const metadata: Metadata = { title: "Sound examples" }

export default function SoundsPage() {
  return <SoundBooth />
}
