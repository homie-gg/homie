FROM node:20.10.0

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN

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