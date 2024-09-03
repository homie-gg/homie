export interface Storage {
  getUrl: (file: string) => string
  getPath: (file: string) => string
  move: (oldPath: string, newPath: string) => Promise<void>
  put: (file: string, contents: string) => Promise<void>
}
