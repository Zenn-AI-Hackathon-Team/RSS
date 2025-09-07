import * as categoriesRepo from "@/app/api/repositories/categoriesRepo";
import * as linksRepo from "@/app/api/repositories/linksRepo";
import * as countsRepo from "@/app/api/repositories/countsRepo";
import { db } from "@/lib/firebaseAdmin";

type BackfillResult = {
  inbox: number;
  categories: Array<{ id: string; count: number }>;
};

export async function backfillCounts(uid: string): Promise<BackfillResult> {
  // 1) read all categories and links
  const [catDocs, linkDocs] = await Promise.all([
    categoriesRepo.list(uid),
    linksRepo.listAll(uid),
  ]);

  const catIds = catDocs.map((d) => d.id);

  // 2) aggregate in memory
  const catCount = new Map<string, number>();
  let inbox = 0;
  for (const doc of linkDocs) {
    const data = doc.data() as { categoryId?: string | null };
    const c = data?.categoryId ?? null;
    if (c === null) {
      inbox++;
    } else {
      catCount.set(c, (catCount.get(c) ?? 0) + 1);
    }
  }

  // 3) write in batches (500 writes per batch limit)
  const writes: Array<() => void> = [];
  for (const id of catIds) {
    const value = catCount.get(id) ?? 0;
    writes.push(() => {
      const batch = currentBatch!;
      categoriesRepo.setLinkCountInBatch(uid, id, value, batch);
    });
  }

  // counts doc for inbox
  const writeInbox = (batch: FirebaseFirestore.WriteBatch) => {
    countsRepo.setInboxCountInBatch(uid, inbox, batch);
  };

  let currentBatch: FirebaseFirestore.WriteBatch | null = null;
  let opInBatch = 0;
  const commitBatch = async () => {
    if (currentBatch && opInBatch > 0) {
      await currentBatch.commit();
    }
    currentBatch = null;
    opInBatch = 0;
  };

  // helper: ensure batch
  const ensureBatch = () => {
    if (!currentBatch) currentBatch = db.batch();
  };

  // enqueue category writes
  for (const write of writes) {
    ensureBatch();
    write();
    opInBatch++;
    if (opInBatch >= 450) {
      // keep margin under 500
      await commitBatch();
      ensureBatch();
    }
  }
  // enqueue inbox write
  ensureBatch();
  writeInbox(currentBatch!);
  opInBatch++;
  await commitBatch();

  return {
    inbox,
    categories: catIds.map((id) => ({ id, count: catCount.get(id) ?? 0 })),
  };
}

