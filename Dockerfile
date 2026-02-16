# Use official Node.js lightweight image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables (can be overridden)
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
