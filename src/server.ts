import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function startServer() {
  const app = await buildApp();

  try {
    // Start listening on port from env
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    
    // Print proper success messages!
    console.log(`\n🚀 Server successfully running at http://localhost:${env.PORT}`);
    console.log(`🔌 Database connection established.\n`);
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
