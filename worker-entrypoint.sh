#!/bin/bash

npm run queue:schedule-jobs
npm run queue:dashboard &

if [[ "$WATCH_MODE" == "true" ]]; then
   echo "Running worker in watch mode"
   npx dotenv -e .env.local tsx -- --watch src/queue/work.ts
else
  echo "Running worker"
  npm run queue:work
fi