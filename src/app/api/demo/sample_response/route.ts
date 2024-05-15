import { getSampleResponse } from '@/lib/ai/get-sample-response'
import { createRoute } from '@/lib/http/server/create-route'
import { TooManyRequestsException } from '@/lib/http/server/exceptions/too-many-requests-exception'
import { rateLimit } from '@/lib/redis/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const POST = createRoute(
  {
    body: z.object({
      persona_g_level: z.number(),
      persona_positivity_level: z.number(),
      persona_affection_level: z.number(),
      persona_emoji_level: z.number(),
    }),
    response: z.object({
      message: z.string(),
    }),
  },
  async (request) => {
    const { body } = request

    const isRateLimited = await rateLimit('get_sample_response', {
      max: 300,
      durationSecs: 60,
    })

    if (isRateLimited) {
      throw new TooManyRequestsException()
    }

    const output = await getSampleResponse({
      gLevel: body.persona_g_level,
      positivityLevel: body.persona_positivity_level,
      affectionLevel: body.persona_affection_level,
      emojiLevel: body.persona_emoji_level,
    })

    return NextResponse.json({
      message: output,
    })
  },
)
