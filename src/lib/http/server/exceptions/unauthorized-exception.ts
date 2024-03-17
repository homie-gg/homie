import {
  HttpException,
  HttpExceptionMetadata,
  ThrowingOptions,
} from '@/lib/http/server/exceptions'

export class UnauthorizedException extends HttpException {
  constructor(
    public metadata: HttpExceptionMetadata,
    options?: ThrowingOptions,
  ) {
    super(401, metadata, options)
  }
}
