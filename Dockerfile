# -- compilation --
FROM node:22.12.0-alpine AS build
WORKDIR /app

# install dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#node-gyp-alpine
RUN apk add --no-cache --virtual .gyp python3 py-setuptools make g++ \
    && npm ci \
    && apk del .gyp

# copy in app code and build it
COPY . .
RUN npm run build

# -- execution --
FROM node:22.12.0-alpine
WORKDIR /app

RUN apk add --no-cache tini

# install production dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#node-gyp-alpine
RUN apk add --no-cache --virtual .gyp python3 py-setuptools make g++ \
    && npm ci --omit=dev --workspace=backend --include-workspace-root \
    && npm cache clean --force \
    && apk del .gyp

# add the already compiled code and the default config
# (custom config must be set via volume)
COPY --from=build /app/dist ./dist
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist

# config
USER node
ENV PORT=8080
EXPOSE 8080

# use tini as init process since Node.js isn't designed to be run as PID 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "--disable-proto=delete", "dist/main.js"]
