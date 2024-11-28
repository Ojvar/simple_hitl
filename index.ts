import { App } from "./src/app";

function run() {
  const port = +(process.env.PORT || 8000);
  const host = process.env.HOST || "0.0.0.0";

  const app = new App(port, host);
  app.run();

  return app;
}

run();
