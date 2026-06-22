export const MISSING_REDIS_URL_MESSAGE =
  'REDIS_URL is required. Set it to a valid redis:// or rediss:// connection string.';

export function getRedisUrlFromEnv() {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    throw new Error(MISSING_REDIS_URL_MESSAGE);
  }

  return redisUrl;
}

export function parseRedisUrl(redisUrl) {
  let url;

  try {
    url = new URL(redisUrl);
  } catch {
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.');
  }

  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must start with redis:// or rediss://.');
  }

  return {
    host: url.hostname,
    port: Number(url.port || '6379'),
  };
}
