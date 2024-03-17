import {
  HttpException,
  HttpExceptionMetadata,
  ThrowingOptions,
} from '@/lib/http/server/exceptions/http-exception'

export class BadRequestException extends HttpException {
  constructor(
    public metadata: HttpExceptionMetadata,
    options?: ThrowingOptions,
  ) {
    super(400, metadata, options)
  }
}
