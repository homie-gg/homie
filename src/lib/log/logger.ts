import winston, { format, transports } from 'winston'

export const logger = winston.createLogger({
  level: process.env.NEXT_PUBLIC_APP_LOG_LEVEL || 'info',
  format: format.json(),
  transports: [new transports.Console()],
})
