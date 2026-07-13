import net from 'node:net';
import { getDatabaseUrlFromEnv, parseDatabaseUrl } from './database-url.mjs';

const [retriesArg = '30', sleepMsArg = '2000'] = process.argv.slice(2);
const retries = Number(retriesArg);
const sleepMs = Number(sleepMsArg);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function canConnect(host, port) {
  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const databaseUrl = getDatabaseUrlFromEnv();
  const { host, port, database } = parseDatabaseUrl(databaseUrl);

  console.log(`Waiting for PostgreSQL at ${host}:${port}/${database}...`);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (await canConnect(host, port)) {
      console.log(`PostgreSQL is reachable at ${host}:${port}/${database}.`);
      return;
    }

    console.log(`PostgreSQL not ready yet (${attempt}/${retries}).`);
    await sleep(sleepMs);
  }

  throw new Error('PostgreSQL did not become reachable in time.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
