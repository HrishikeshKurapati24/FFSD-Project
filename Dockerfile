# Use Node.js 20 on Alpine Linux for a small image size
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
# We do this before copying the rest of the code to take advantage of Docker's layer caching
COPY package*.json ./

# Install only production dependencies for a leaner image
RUN npm install --production

# Copy the rest of the application code (except what's in .dockerignore)
COPY . .

# Expose the port the backend app runs on (standard for this project)
EXPOSE 3000

# Set environment variables for production (can be overridden in docker-compose)
ENV NODE_ENV=production

# The command to start the application
CMD ["node", "app.js"]
