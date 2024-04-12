import { WinstonTransport as AxiomTransport } from '@axiomhq/winston'
import winston, { format, transports as winstonTransports } from 'winston'

const transports =
  process.env.NODE_ENV === 'production'
    ? [
        new AxiomTransport({
          dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET!,
          token: process.env.NEXT_PUBLIC_AXIOM_TOKEN!,
          orgId: process.env.AXIOM_ORG_ID!,
        }),
      ]
    : [new winstonTransports.Console()]

export const logger = winston.createLogger({
  level: process.env.NEXT_PUBLIC_APP_LOG_LEVEL || 'info',
  format: format.combine(format.errors({ stack: true }), format.json()),
  transports: transports,
  exceptionHandlers: transports,
  rejectionHandlers: transports,
})
