import {
  HttpException,
  HttpExceptionMetadata,
  ThrowingOptions,
} from '@/lib/http/server/exceptions'

export class MethodNotAllowedException extends HttpException {
  constructor(
    public metadata: HttpExceptionMetadata,
    options?: ThrowingOptions,
  ) {
    super(405, metadata, options)
  }
}
