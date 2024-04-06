FROM node:20.10.0

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

# Running the app
CMD [ "npm", "start" ]