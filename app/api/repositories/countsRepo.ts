import { db } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

function countsDoc(uid: string) {
  return db.collection("users").doc(uid).collection("meta").doc("counts");
}

export async function getInboxCount(uid: string): Promise<number | null> {
  const snap = await countsDoc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as { inbox?: number } | undefined;
  return typeof data?.inbox === "number" ? data!.inbox! : null;
}

export async function incrementInboxCount(uid: string, delta: number) {
  const ref = countsDoc(uid);
  await ref.set({ inbox: admin.firestore.FieldValue.increment(delta) }, { merge: true });
}

export function incrementInboxCountInBatch(
  uid: string,
  delta: number,
  batch: FirebaseFirestore.WriteBatch,
) {
  const ref = countsDoc(uid);
  batch.set(ref, { inbox: admin.firestore.FieldValue.increment(delta) }, { merge: true });
}

export async function setInboxCount(uid: string, value: number) {
  const ref = countsDoc(uid);
  await ref.set({ inbox: value }, { merge: true });
}

export function setInboxCountInBatch(
  uid: string,
  value: number,
  batch: FirebaseFirestore.WriteBatch,
) {
  const ref = countsDoc(uid);
  batch.set(ref, { inbox: value }, { merge: true });
}
