FROM node:22.22.3-alpine3.22 AS build

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
# Use the unprivileged nginx image: runs as user `nginx` (UID 101) and
# listens on 8080 by default — no root required.
#

FROM nginxinc/nginx-unprivileged:alpine AS production

# Copy the built files from the build stage
COPY --from=build /code/dist /usr/share/nginx/html

# Custom nginx configuration (listens on 8080, writes pid/temp dirs to /tmp)
COPY --from=build /code/misc/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
