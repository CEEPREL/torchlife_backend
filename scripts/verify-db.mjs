import { PrismaClient } from '@prisma/client';
import { getDatabaseUrlFromEnv, parseDatabaseUrl } from './database-url.mjs';

const prisma = new PrismaClient();

function getExpectedDatabaseName() {
  const databaseUrl = getDatabaseUrlFromEnv();
  return parseDatabaseUrl(databaseUrl).database;
}

async function main() {
  const expectedDatabaseName = getExpectedDatabaseName();

  await prisma.$connect();

  const currentDatabaseRows = await prisma.$queryRawUnsafe(
    'SELECT current_database() AS current_database',
  );
  const currentDatabase =
    Array.isArray(currentDatabaseRows) &&
      currentDatabaseRows[0] &&
      typeof currentDatabaseRows[0].current_database === 'string'
      ? currentDatabaseRows[0].current_database
      : null;

  if (!currentDatabase) {
    throw new Error('Unable to determine current PostgreSQL database.');
  }

  if (currentDatabase !== expectedDatabaseName) {
    throw new Error(
      `Connected to unexpected database. Expected "${expectedDatabaseName}" but received "${currentDatabase}".`,
    );
  }

  const migrationTableRows = await prisma.$queryRawUnsafe(
    "SELECT to_regclass('_prisma_migrations')::text AS migration_table",
  );
  const migrationTableExists =
    Array.isArray(migrationTableRows) &&
    migrationTableRows[0] &&
    migrationTableRows[0].migration_table !== null;

  if (!migrationTableExists) {
    throw new Error('Prisma migration table was not found.');
  }

  const tableRows = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );

  if (!Array.isArray(tableRows) || tableRows.length === 0) {
    throw new Error('No public tables were found after migrations.');
  }

  console.log(
    `Database validation passed for "${currentDatabase}" with ${tableRows.length} public tables.`,
  );
}

main()
  .catch((error) => {
    console.error('Database validation failed.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
