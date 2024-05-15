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
# Building app
RUN npm run build

EXPOSE 3000

COPY ./worker-entrypoint.sh /usr/local/bin/docker-init.sh
RUN chmod +x /usr/local/bin/docker-init.sh

ENTRYPOINT [ "docker-init.sh" ]
CMD ["/bin/bash"]