const autocannon = require("autocannon");

const url = process.env.TARGET_URL;
if (!url) {
  console.error("Set TARGET_URL, e.g. $env:TARGET_URL = 'http://127.0.0.1:12345'");
  process.exit(1);
}

const instance = autocannon(
  {
    url,
    connections: 50,
    duration: 120,
    requests: [
      {
        method: "GET",
        // Random IDs produce a mix of cache hits and misses
        setupRequest: (req) => ({
          ...req,
          path: `/api/data/${Math.floor(Math.random() * 5000)}`,
        }),
      },
    ],
  },
  (err) => {
    if (err) console.error(err);
  }
);

autocannon.track(instance);
