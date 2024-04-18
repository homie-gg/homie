import fs from 'node:fs'
import path from 'node:path'

export function getFiles(dirPath: string, extension: string) {
  const results: string[] = []

  try {
    const files: string[] = fs.readdirSync(dirPath)

    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const isDir = !file.includes(extension)
      if (isDir) {
        const nested = getFiles(filePath, extension)
        results.push(...nested)
      } else {
        results.push(filePath)
      }
    }
  } catch {
    // ignore failing to read any unknown directories/files
  }
  return results
}
