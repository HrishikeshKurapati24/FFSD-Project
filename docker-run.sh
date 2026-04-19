#!/bin/bash

# CollabSync Docker Execution Helper

# 1. Build the images
echo "Building CollabSync images..."
docker compose build

# 2. Start the services in the background
echo "Starting services..."
docker compose up -d

# 3. Wait for database to be ready
echo "Waiting for services to initialize..."
sleep 10

# 4. Show running containers
docker ps

echo "------------------------------------------------"
echo "CollabSync is now running!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3000"
echo "To stop: docker compose down"
echo "------------------------------------------------"