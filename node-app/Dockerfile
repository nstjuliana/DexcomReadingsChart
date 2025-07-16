# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all remaining files
COPY . .

# Expose the port your app runs on (change if not 3000)
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
