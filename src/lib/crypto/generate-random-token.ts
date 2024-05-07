import crypto from 'node:crypto'

export const generateRandomToken = (): string =>
  crypto.randomBytes(64).toString('base64')
