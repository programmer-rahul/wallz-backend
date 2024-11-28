# Use an official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the package.json and yarn.lock first (to optimize caching)
COPY package.json yarn.lock ./

# Install all dependencies (including devDependencies)
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Remove devDependencies to reduce image size
RUN yarn install --production --force

# Expose the port your app runs on
EXPOSE 4000

# Command to run your application
CMD ["node", "dist/index.js"]
