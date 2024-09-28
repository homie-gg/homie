FROM node:20.10.0

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN $SENTRY_AUTH_TOKEN

ARG WATCH_MODE
ENV WATCH_MODE $WATCH_MODE

# Install chromium browser
RUN apt-get update && apt-get install -y chromium 
ENV CHROME_BIN="/usr/bin/chromium"

# Install python & pip
RUN apt-get install -y python3 python3-pip python3-venv

# Install Aider
RUN python3 -m pip install pipx --break-system-packages
RUN python3 -m pipx ensurepath --force 
RUN pipx install aider-chat
RUN ln -sf /root/.local/bin/aider /usr/local/bin/aider


# Setting working directory. All the path will be relative to WORKDIR
WORKDIR /app

# Installing dependencies
# Do not include bundled chromium with Puppeteer (doesn't work in container)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
COPY --link package-lock.json package.json ./
RUN npm ci

# Copying source files
COPY --link . .

COPY ./worker-entrypoint.sh /usr/local/bin/docker-init.sh
RUN chmod +x /usr/local/bin/docker-init.sh


ENTRYPOINT [ "docker-init.sh" ]

EXPOSE 3100

CMD ["/bin/bash"]