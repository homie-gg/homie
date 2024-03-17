export type HttpExceptionMetadata = {
  type: string
  message: string
} & Record<string, unknown>

export interface ThrowingOptions {
  json?: boolean
}

export class HttpException extends Error {
  options: {
    json?: boolean
  }

  constructor(
    public status: number,
    public metadata: HttpExceptionMetadata,
    options?: ThrowingOptions,
  ) {
    super(metadata.message)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    this.options = options ?? { json: true }
  }

  toString() {
    return `HttpException: ${this.status}, ${this.metadata.message} (${this.metadata.type})`
  }
}
