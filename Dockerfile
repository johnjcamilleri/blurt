# Stage 1: Build
FROM node:22.21-alpine3.22 AS build

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

# Stage 2: Production
FROM node:22.21-alpine3.22 AS production

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/client ./client

# Install only production dependencies
RUN npm ci --omit=dev

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
