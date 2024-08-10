#!/bin/bash

npm run queue:schedule-jobs
npm run queue:dashboard &

if [[ $WATCH_MODE -eq "true" ]]; then
   npx dotenv -e .env.local tsx -- --watch src/queue/work.ts
else
  npm run queue:work
fi