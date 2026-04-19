# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm install

# Copy the frontend source code
COPY . .

# Build the production-ready static files (usually to 'dist' folder)
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the custom Nginx configuration to handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built files from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (standard HTTP)
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
