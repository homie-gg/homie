FROM node:20.10.0

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN

ARG WATCH_MODE
ENV WATCH_MODE $WATCH_MODE

# Setting working directory. All the path will be relative to WORKDIR
WORKDIR /app

# Installing dependencies
COPY package*.json ./
RUN npm install

# Copying source files
COPY . .

COPY ./worker-entrypoint.sh /usr/local/bin/docker-init.sh
RUN chmod +x /usr/local/bin/docker-init.sh

ENTRYPOINT [ "docker-init.sh" ]

EXPOSE 3100

CMD ["/bin/bash"]