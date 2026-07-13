FROM node:24-bookworm
WORKDIR /usr/src/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
RUN node .yarn/releases/yarn-4.16.0.cjs install --immutable
COPY . .
RUN chmod +x scripts/*.sh
RUN npx prisma generate
RUN node .yarn/releases/yarn-4.16.0.cjs build
ARG PORT=3000
EXPOSE ${PORT}
CMD ["./scripts/start.sh", "node", "dist/main.js"]