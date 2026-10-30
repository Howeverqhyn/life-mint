import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? 8787);
const app = createApp();

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`life-mint api  http://0.0.0.0:${port}`);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
