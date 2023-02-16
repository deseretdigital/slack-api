FROM node:latest AS build

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && apt-get clean \
    && apt-get autoremove

WORKDIR /usr/src/app

COPY package*.json /usr/src/app/

RUN npm ci --only=production

FROM node:19.6-bullseye-slim@sha256:34211d15e360eff92c17587ff3c3d3bea3061ca3961f745fd59ab30bda954ff9
ENV NODE_ENV production

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app

EXPOSE 3000

CMD ["dumb-init", "node", "api/index.js"]