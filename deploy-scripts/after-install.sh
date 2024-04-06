#!/bin/bash


sudo chmod 777 -R /app

# Retrieve env files from S3
sudo aws s3 cp s3://prod-app-env-voidpm/.env /app/.env.local

# allow scripts
sudo chmod +x /app/deploy-scripts/application-start.sh

sudo kill -9 $(lsof -i:3100 -t) 2> /dev/null || true

su ubuntu

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash #nvm
source /root/.bashrc

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install v20.9.0
nvm use v20.9.0

cd /app

npm install

npm run queue:dashboard > /dev/null 2> /dev/null < /dev/null &

exit 0