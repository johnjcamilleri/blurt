# Use the official Node.js LTS Alpine image as the base image
FROM node:lts-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm ci

# Copy the rest of the application code to the working directory
COPY . .

# Build the backend
RUN npm run build

# Build the frontend
RUN npm run build:client

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
