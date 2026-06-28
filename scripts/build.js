import { access, mkdir, writeFile } from "node:fs/promises";

await access("server.js");
await access("styles.css");
await mkdir("dist", { recursive: true });
await writeFile("dist/build-info.json", JSON.stringify({
  built_at: new Date().toISOString(),
  app: "vibeops-env-db-demo"
}, null, 2));
console.log("Build ok");
