# -- compilation --
FROM node:20.17.0-alpine AS build
WORKDIR /app

# install dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci

# copy in app code and build it
COPY . .
RUN npm run build


# -- execution --
FROM node:20.17.0-alpine
WORKDIR /app

# install PRODUCTION dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci --omit=dev
RUN apk add --no-cache tini

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
CMD ["node", "--disable-proto=delete", "dist/main.js"]
