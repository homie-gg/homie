export class HttpRequestException extends Error {
  statusCode: number
  data?: Record<string, any>
  constructor(status: number, message?: string, data?: Record<string, any>) {
    super(message)
    this.statusCode = status
    this.data = data
  }
}
