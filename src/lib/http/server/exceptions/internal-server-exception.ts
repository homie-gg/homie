import {
  HttpException,
  HttpExceptionMetadata,
  ThrowingOptions,
} from '@/lib/http/server/exceptions'

export class InternalServerErrorException extends HttpException {
  constructor(
    public metadata: HttpExceptionMetadata,
    options?: ThrowingOptions,
  ) {
    super(500, metadata, options)
  }
}
