import { HttpException, ThrowingOptions } from '@/lib/http/server/exceptions'
import { HttpExceptionMetadata } from '@/lib/http/server/exceptions/http-exception'

export class NotFoundException extends HttpException {
  constructor(
    public metadata: HttpExceptionMetadata,
    options?: ThrowingOptions,
  ) {
    super(404, metadata, options)
  }
}
