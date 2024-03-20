import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: ['/', '/api/github/webhook'],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
