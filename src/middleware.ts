import loggingMiddleware from '@/lib/log/axiom-request-middleware'
import { authMiddleware } from '@clerk/nextjs'

const middleware = authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/health',
    '/api/github/webhook',
    '/api/slack/event',
    '/api/slack/interaction',
    '/api/stripe/webhook',
    '/api/gitlab/webhook',
    '/api/demo/sample_response',
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    '/health',
    '/privacy',
    '/terms',
    '/blog',
    '/blog/(.*)',
    '/docs',
    '/docs/(.*)',
  ],
})

const withLogging =
  process.env.NODE_ENV === 'production'
    ? loggingMiddleware(middleware)
    : middleware

export default withLogging

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
