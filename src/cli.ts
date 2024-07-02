import * as repl from 'node:repl'
import { dbClient } from '@/database/client'
import { dispatch } from '@/queue/default-queue'

const replServer = repl.start('> ')

replServer.context.dbClient = dbClient
replServer.context.dispatch = dispatch
