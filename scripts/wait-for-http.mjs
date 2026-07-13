const [url, retriesArg = '30', sleepMsArg = '2000'] = process.argv.slice(2);

if (!url) {
  console.error('Usage: node wait-for-http.mjs <url> [retries] [sleepMs]');
  process.exit(1);
}

const retries = Number(retriesArg);
const sleepMs = Number(sleepMsArg);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`HTTP endpoint is healthy: ${url}`);
        return;
      }
    } catch {
      // Ignore transient startup errors and retry.
    }

    console.log(`HTTP endpoint not ready yet (${attempt}/${retries}): ${url}`);
    await sleep(sleepMs);
  }

  throw new Error(`HTTP endpoint did not become healthy in time: ${url}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
