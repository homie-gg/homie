export const getOverPRLimitMessage = () =>
  `Sorry, you're currently over your plan's monthly Pull Request limit. You can update your plan at ${process.env.NEXT_PUBLIC_APP_URL}/billing.`
