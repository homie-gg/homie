import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import mime from 'mime-types'
import path from 'node:path'
import { storage } from '@/lib/storage'

/**
 * Storage route to return files when using FILE_DRIVER=local
 * @param _req
 * @param context
 */
export const GET = (
  _req: NextRequest,
  context: {
    params: {
      file: Array<string>
    }
  },
) => {
  const filePath = context.params.file.join('/')

  const storagePath = storage.getPath(filePath)

  try {
    const file = fs.readFileSync(storagePath)
    const extension = path.extname(storagePath)

    const contentType = mime.contentType(extension)

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-type': contentType || 'text/plain',
      },
    })
  } catch {
    return NextResponse.json(
      {
        message: 'Not Found',
      },
      { status: 404 },
    )
  }
}
