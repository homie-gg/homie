#!/bin/bash


sudo chmod 777 -R /app

# Retrieve env files from S3
sudo aws s3 cp s3://void-prod-app-env/.env /app/.env.local

# kill existing dashboard
sudo kill -9 $(lsof -i:3100 -t) 2> /dev/null || true

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash #nvm
source /root/.bashrc

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install v20.9.0
nvm use v20.9.0

cd /app

# Run db migrations
npm run db:migrate

# Set billing plans
npm run billing:create-plans

# Start queue dashbboard
npm run queue:dashboard > /dev/null 2> /dev/null < /dev/null &

exit 0