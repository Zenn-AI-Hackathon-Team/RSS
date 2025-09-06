// End-to-end: create a link via usecase and persist to Firestore
// Usage: npx -y tsx scripts/devtest/create_link.ts <URL> [UID]
// Loads .env manually to support running without extra deps.

import fs from "node:fs";
import path from "node:path";
// NOTE: usecase は import 時に Firebase Admin を初期化するため、
// .env を読み込んでから動的 import する

function loadEnvFile(file = ".env") {
  try {
    const p = path.resolve(process.cwd(), file);
    const content = fs.readFileSync(p, "utf8");
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const m = line.match(/^(\w[\w_]*)=(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\n/g, "\n");
      if (process.env[key] == null) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

async function main() {
  loadEnvFile();
  const url = process.argv[2] || "https://example.com/";
  const uid = process.argv[3] || "local-test-user";

  const { createLink } = await import("../../app/api/usecases/links");
  const result = await createLink(uid, url);
  console.log(JSON.stringify({ created: result.created, link: result.link }, null, 2));
}

main().catch((e) => {
  console.error("Create link failed:", e);
  process.exit(1);
});
