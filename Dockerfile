#
# Build: docker build --memory=2g -t myapp .
# Run: docker run -p 127.0.0.1:5173:80 --mount type=bind,source="$(pwd)"/config2.json,target=/usr/share/nginx/html/config.json,readonly myapp
# Base Image - Build the TypeScript web app
# 

FROM node:22.12.0-alpine AS build

WORKDIR /code

# Copy the application code to the container
COPY ./ ./

ARG version=v0.0

RUN echo 'export default "'${version#v}'";' > /code/rsc/version.tsx && \
    npm pkg set version=${version#v} && \
    npm ci

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

#
# Final Image - Nginx server to serve the built files
#

FROM nginx:alpine AS production

# Copy the built files from the build stage
COPY --from=build /code/dist /usr/share/nginx/html

# Copy the Nginx configuration from the scripts folder in the original codebase
# TODO: move nginx config...
COPY --from=build /code/misc/nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for the web server
EXPOSE 80

# Start Nginx server
ENTRYPOINT ["nginx", "-g", "daemon off;"]
