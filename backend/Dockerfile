# Use a full-featured Node.js image based on Debian, which makes it easier to install build tools.
FROM node:20

# Set the working directory in the container.
WORKDIR /usr/src/app

# Install essential build tools required by node-gyp for native addons like swisseph.
# - python3: Required by node-gyp to compile C++ addons.
# - make: A build automation tool.
# - g++: The GNU C++ compiler.
RUN apt-get update && apt-get install -y python3 make g++

# Copy package.json and package-lock.json first to leverage Docker's layer caching.
# This step will only be re-run if these files change.
COPY package*.json ./

# Install app dependencies.
RUN npm install

# Copy the rest of the backend source code into the container.
COPY . .

# The app listens on port 9000, so we expose it.
EXPOSE 9000

# Define the command to run the app.
CMD [ "npm", "start" ]
