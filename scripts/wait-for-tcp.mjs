import net from 'node:net';

const [host, portArg, retriesArg = '30', sleepMsArg = '2000', label = 'service'] =
  process.argv.slice(2);

if (!host || !portArg) {
  console.error('Usage: node wait-for-tcp.mjs <host> <port> [retries] [sleepMs] [label]');
  process.exit(1);
}

const port = Number(portArg);
const retries = Number(retriesArg);
const sleepMs = Number(sleepMsArg);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function canConnect() {
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
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (await canConnect()) {
      console.log(`${label} is reachable at ${host}:${port}.`);
      return;
    }

    console.log(`${label} not ready yet (${attempt}/${retries}).`);
    await sleep(sleepMs);
  }

  throw new Error(`${label} did not become reachable in time.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
