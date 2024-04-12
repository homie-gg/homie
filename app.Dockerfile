FROM node:20.10.0

# Build Arguments

ARG LINE_CHANNEL_ACCESS_TOKEN 
ENV LINE_CHANNEL_ACCESS_TOKEN $LINE_CHANNEL_ACCESS_TOKEN

ARG LINE_CHANNEL_SECRET
ENV LINE_CHANNEL_SECRET $LINE_CHANNEL_SECRET

# Setting working directory. All the path will be relative to WORKDIR
WORKDIR /app

# Installing dependencies
COPY package*.json ./
RUN npm install

# Copying source files
COPY . .

# Replace .env.local with PROD public variables, so that 
# they'll be included in the client-side build.
COPY ./.env.local.prod /app/.env.local

# Building app
RUN npm run build

EXPOSE 3000

# Running the app
CMD [ "npm", "start" ]