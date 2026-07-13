import Redis from 'ioredis';
import { getRedisUrlFromEnv } from './redis-url.mjs';

const redis = new Redis(getRedisUrlFromEnv(), {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  connectTimeout: 5000,
});

async function main() {
  const healthKey = `torchlife:healthcheck:${Date.now()}`;

  await redis.connect();

  const pong = await redis.ping();
  if (pong !== 'PONG') {
    throw new Error(`Unexpected Redis ping response: ${pong}`);
  }

  await redis.set(healthKey, 'ok', 'EX', 30);
  const storedValue = await redis.get(healthKey);

  if (storedValue !== 'ok') {
    throw new Error('Redis set/get validation failed.');
  }

  await redis.del(healthKey);
  console.log('Redis validation passed.');
}

main()
  .catch((error) => {
    console.error('Redis validation failed.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await redis.quit();
  });
