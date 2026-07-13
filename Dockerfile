FROM node:20-bookworm
WORKDIR /usr/src/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
RUN node .yarn/releases/yarn-4.16.0.cjs install --immutable
COPY . .
RUN chmod +x scripts/*.sh
RUN npx prisma generate
RUN node .yarn/releases/yarn-4.16.0.cjs build
EXPOSE 3000
CMD ["./scripts/start.sh", "node", "dist/main.js"]