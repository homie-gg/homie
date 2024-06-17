import { NextRequest, NextResponse } from 'next/server'

export const POST = async (request: NextRequest) => {
  // TODO: handle webhooks!
  console.log(await request.json())
  return NextResponse.json({})
}

export const HEAD = async () => {
  // Send a 200 for Trello endpoint validation
  return NextResponse.json({})
}
