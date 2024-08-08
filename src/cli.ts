import * as repl from 'node:repl'
import { dbClient } from '@/database/client'
import { dispatch } from '@/queue/dispatch'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'

const replServer = repl.start('> ')

replServer.context.dbClient = dbClient
replServer.context.dispatch = dispatch
replServer.context.pineconeIndex = getPineconeClient().Index(
  process.env.PINECONE_INDEX_MAIN!,
)
