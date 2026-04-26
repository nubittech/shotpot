const http = require("http");
const next = require("next");

const port = 6000;
const app = next({ dev: true, port, hostname: "localhost" });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, "0.0.0.0", () => {
        console.log(`> Web ready on http://localhost:${port}`);
      });
  })
  .catch((err) => {
    console.error("Failed to start web server", err);
    process.exit(1);
  });
