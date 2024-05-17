'use client'

import { Button } from '@/lib/ui/Button'
import { Label } from '@/lib/ui/Label'
import { Slider } from '@/lib/ui/Slider'
import { useState } from 'react'
import { http } from '@/lib/http/client/http'
import SlackMessage from '@/lib/ui/SlackMessage'

export default function CustomizePlayground() {
  const [g, setG] = useState([10])
  const [positivityLevel, setPositivityLevel] = useState([10])
  const [likeLevel, setLikeLevel] = useState([10])
  const [emojiLevel, setEmojiLevel] = useState([10])
  const [response, setResponse] = useState(
    'Yo homie! Last week we merged some lit PRs 🚀🎉\n1. Updated the hero text 🦸‍♂️\n2. Added drag-drop feature to the list of items 🔄\n3. Fixed the infinite loop on the account page 🔧\n\nKeep up the good work fam! 💯🔥🙌 #PositiveVibesOnly',
  )

  const getResponse = () => {
    setResponse('')

    http
      .post<{ message: string }>('/api/demo/sample_response', {
        persona_g_level: g[0],
        persona_positivity_level: positivityLevel[0],
        persona_affection_level: likeLevel[0],
        persona_emoji_level: emojiLevel[0],
      })
      .then((data) => setResponse(data.message))
  }

  return (
    <div className="container h-screen">
      <div className="mb-8">
        <h3 className="font-black text-8xl text-center mb-4">Your homie.</h3>
        <p className="text-center text-lg">
          Customize homie&apos;s tone to match your team or just for fun.
        </p>
      </div>
      <div className="grid gap-12 lg:gap-[5%] lg:grid-cols-[25%_70%]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gLevel">💵 How much of a g?</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {g}
              </span>
            </div>
            <Slider
              id="gLevel"
              min={0}
              max={10}
              step={1}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="g level"
              defaultValue={g}
              onValueChange={setG}
            />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="positivity">🌈 Positivity</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {positivityLevel}
              </span>
            </div>
            <Slider
              id="positivity"
              min={0}
              max={10}
              step={1}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="positivity"
              defaultValue={positivityLevel}
              onValueChange={setPositivityLevel}
            />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="positivity">
                ❤️ How much does homie like you?
              </Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {likeLevel}
              </span>
            </div>
            <Slider
              id="likeLevel"
              min={0}
              max={10}
              step={1}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="likeLevel"
              defaultValue={likeLevel}
              onValueChange={setLikeLevel}
            />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="positivity">💩 How many emojis?</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {emojiLevel}
              </span>
            </div>
            <Slider
              id="emojiLevel"
              min={0}
              max={10}
              step={1}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="emojiLevel"
              defaultValue={emojiLevel}
              onValueChange={setEmojiLevel}
            />
          </div>

          <Button className="mt-4" onClick={getResponse}>
            See Response
          </Button>
        </div>
        <SlackMessage message={response} />
      </div>
    </div>
  )
}
