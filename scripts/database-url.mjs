export const MISSING_DATABASE_URL_MESSAGE =
  'DATABASE_URL is required. Set it to a valid postgresql:// or postgres:// connection string.';

export function getDatabaseUrlFromEnv() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(MISSING_DATABASE_URL_MESSAGE);
  }

  return databaseUrl;
}

export function parseDatabaseUrl(databaseUrl) {
  let url;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid postgresql:// or postgres:// URL.');
  }

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://.');
  }

  return {
    host: url.hostname,
    port: Number(url.port || '5432'),
    database: url.pathname.replace(/^\//, '') || 'postgres',
  };
}
