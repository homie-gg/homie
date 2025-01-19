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
    '/api/trello/webhook',
    '/api/asana/projects/:project_id/webhook',
    '/api/demo/sample_response',
    '/onboarding',
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ['/health', '/privacy', '/terms', '/blog', '/blog/(.*)'],
})

const withLogging =
  process.env.NODE_ENV === 'production'
    ? loggingMiddleware(middleware, {
        // Do not log these routes
        ignoredRoutes: ['/health'],
      })
    : middleware

export default withLogging

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
