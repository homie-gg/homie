#!/bin/bash

npm run queue:schedule-jobs
npm run queue:dashboard &
npm run queue:work