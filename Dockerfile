FROM node:22.12.0-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm i -g pnpm

# Install dependencies
RUN pnpm i

# Allow only pnpm
RUN pnpm run preinstall

# Bundle app source
COPY . .

# Build the TypeScript files
RUN pnpm run build

# Expose port 8080
EXPOSE 8080

# Start the app
CMD ["pnpm", "dev"]
