FROM node:18-alpine

WORKDIR /usr/src/app

# Copy all package files
COPY package*.json ./

# Install ALL dependencies (including dev)
RUN npm install

# Copy application code
COPY . .

EXPOSE 3000

# Use nodemon for development (optional)
CMD ["npm", "run", "dev"]
# Or use: CMD ["node", "server.js"]