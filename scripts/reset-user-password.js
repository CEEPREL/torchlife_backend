const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

function loadEnvFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function main() {
  const [, , rawEmail, rawPassword] = process.argv;
  if (!rawEmail || !rawPassword) {
    throw new Error(
      "Usage: node scripts/reset-user-password.js <email> <newPassword>"
    );
  }

  const env = loadEnvFile(path.join(process.cwd(), ".env"));
  process.env.DATABASE_URL = env.DATABASE_URL;

  const prisma = new PrismaClient();
  const email = rawEmail.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(rawPassword, await bcrypt.genSalt());

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(`User not found for ${email}`);
  }

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  });

  process.stdout.write(
    JSON.stringify(
      {
        email,
        userId: user.id,
        updated: true,
        isverified: user.isverified,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
