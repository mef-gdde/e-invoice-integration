# Use the official Node.js 20 image.
FROM node:20.6.0 As production

# Create and change to the app directory.
WORKDIR /app

# Copy package.json and package-lock.json to work directory
COPY package*.json ./

# Install dependencies, including 'devDependencies' since we might need them for the build.
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Expose the port the app runs on
EXPOSE 3011
