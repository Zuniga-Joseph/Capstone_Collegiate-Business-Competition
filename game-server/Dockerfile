FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose game server port
EXPOSE 3001

# Start the game server
CMD ["npm", "start"]
