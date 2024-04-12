import { HttpException, ThrowingOptions } from '@/lib/http/server/exceptions'

export class UnauthorizedException extends HttpException {
  constructor(options?: ThrowingOptions) {
    super(401, { message: 'Unauthorized.', type: 'unauthorized' }, options)
  }
}
