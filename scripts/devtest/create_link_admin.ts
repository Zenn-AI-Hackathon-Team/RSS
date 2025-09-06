// E2E using Firebase Admin directly + fetchOGP
// Usage: npx tsx scripts/devtest/create_link_admin.ts <URL> [UID]

import fs from "node:fs";
import path from "node:path";
// Use the actual OGP implementation from the app
import { fetchOGP } from "../../app/api/_shared/ogp";

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
  const admin = await import("firebase-admin");

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_* envs. Check .env");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  const db = admin.firestore();

  const url = process.argv[2] || "https://ogp.me/";
  const uid = process.argv[3] || "local-test-user";

  console.log("Fetching OGP:", url);
  const ogp = await fetchOGP(url, { timeoutMs: 8000 });
  console.log("OGP:", ogp);

  const data = {
    url,
    title: ogp.title,
    description: ogp.description,
    imageUrl: ogp.imageUrl,
    categoryId: null as string | null,
    provider: ogp.provider,
    fetchStatus: ogp.fetchStatus,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = await db.collection("users").doc(uid).collection("links").add(data);
  const snap = await ref.get();
  console.log("Saved doc id:", ref.id);
  console.log("Saved doc data:", snap.data());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

