# --- Stage 1: Build the React application ---
FROM node:20 AS builder

WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
# VITE_GOOGLE_PLACES_API_KEY is a build-time argument passed from docker-compose.yml
ARG VITE_GOOGLE_PLACES_API_KEY
ENV VITE_GOOGLE_PLACES_API_KEY=${VITE_GOOGLE_PLACES_API_KEY}
RUN npm run build

# --- Stage 2: Serve the application using Nginx ---
FROM nginx:stable-alpine

# Copy the build output from the 'builder' stage to the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The default command for the nginx image is to start the server
CMD ["nginx", "-g", "daemon off;"]
