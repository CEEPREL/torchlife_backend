import net from 'node:net';
import { getRedisUrlFromEnv, parseRedisUrl } from './redis-url.mjs';

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
  const redisUrl = getRedisUrlFromEnv();
  const { host, port } = parseRedisUrl(redisUrl);

  console.log(`Waiting for Redis at ${redisUrl}...`);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (await canConnect(host, port)) {
      console.log(`Redis is reachable at ${host}:${port}.`);
      return;
    }

    console.log(`Redis not ready yet (${attempt}/${retries}).`);
    await sleep(sleepMs);
  }

  throw new Error('Redis did not become reachable in time.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
