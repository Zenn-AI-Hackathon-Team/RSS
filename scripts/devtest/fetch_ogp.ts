// Quick check for fetchOGP
// Usage: npx tsx scripts/devtest/fetch_ogp.ts <URL>

import { fetchOGP } from "../../app/api/_shared/ogp";

async function main() {
  const url = process.argv[2] || "https://example.com/";
  const res = await fetchOGP(url, { timeoutMs: 8000 });
  console.log(JSON.stringify({ url, ...res }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

