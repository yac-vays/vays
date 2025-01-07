#
# Base Image - Build the TypeScript web app
# 

FROM node:22.12.0-alpine AS build

WORKDIR /code

# Copy package.json and package-lock.json (npm ci uses these)
COPY ./package*.json ./

# Install dependencies using npm ci
RUN npm ci

# Copy the application code to the container
COPY ./* /code/

# Build the TypeScript app (assumes the app uses a 'build' script in package.json)
RUN npm run build

#
# Final Image - Nginx server to serve the built files
#

FROM nginx:alpine AS production

# Copy the built files from the build stage
COPY --from=build /code/dist /usr/share/nginx/html

# Copy the Nginx configuration from the scripts folder in the original codebase
COPY ./depl/ /etc/nginx/

# Expose port 80 for the web server
EXPOSE 80

# Start Nginx server
ENTRYPOINT ["nginx", "-g", "daemon off;"]

