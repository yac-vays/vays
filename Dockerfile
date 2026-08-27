FROM node:22.23.2-alpine3.23 AS build

WORKDIR /code

# Install dependencies first so this (expensive) layer is cached as long as
# the lockfile does not change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy only what the build needs (deliberately no .dockerignore: an explicit
# list keeps node_modules, dist/, cert/ keys etc. out of the image and avoids
# busting the npm ci layer above).
COPY index.html vite.config.js tsconfig.json tsconfig.node.json \
     tailwind.config.cjs postcss.config.cjs ./
COPY scripts/run-build.sh ./scripts/
COPY public ./public
COPY rsc ./rsc
COPY src ./src

ARG version=v0.0

RUN echo 'export default "'${version#v}'";' > /code/rsc/version.tsx && \
    npm pkg set version=${version#v}

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

#
# Final Image - Nginx server to serve the built files
#
# Use the unprivileged nginx image: runs as user `nginx` (UID 101) and
# listens on 8080 by default — no root required.
#

FROM nginxinc/nginx-unprivileged:1.31.4-alpine3.24 AS production

# Copy the built files from the build stage
COPY --from=build /code/dist /usr/share/nginx/html

# Custom nginx configuration (listens on 8080, writes pid/temp dirs to /tmp)
COPY misc/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
