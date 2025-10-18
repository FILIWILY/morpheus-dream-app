# Use Node.js 20 (no need for build tools anymore!)
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files first (for Docker layer caching)
COPY package*.json ./

# Install dependencies
# No need for Python/make/g++ since we removed swisseph!
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose port
EXPOSE 9000

# Start the app
CMD ["npm", "start"]
