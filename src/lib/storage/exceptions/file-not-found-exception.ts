export class FileNotFoundException extends Error {
  constructor(file: string) {
    super(`Could not find file: ${file}`)
  }
}
