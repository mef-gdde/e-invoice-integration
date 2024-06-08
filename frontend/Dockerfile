# Use a base image with Node.js 20
FROM node:20.9.0 As production

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port Nuxt.js will run on
EXPOSE 3000