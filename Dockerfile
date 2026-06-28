FROM node:20-alpine

WORKDIR /usr/src/app

# system deps (keep only what you need)
RUN apk add --no-cache curl postgresql-client

# enable yarn via corepack
RUN corepack enable

# copy dependency files first (for caching)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/

RUN yarn install --immutable

# copy full project
COPY . .

# prisma generate
RUN npx prisma generate

# build app
RUN yarn build

EXPOSE 3000

CMD ["node", "dist/main.js"]