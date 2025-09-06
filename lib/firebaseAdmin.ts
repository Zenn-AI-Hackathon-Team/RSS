import admin from "firebase-admin";

// Initialize Firebase Admin SDK once (server-only)
// Supports both Service Account env vars and Application Default Credentials.
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(
	/\\n/g,
	"\n",
);

if (!admin.apps.length) {
	if (projectId && clientEmail && privateKey) {
		admin.initializeApp({
			credential: admin.credential.cert({
				projectId,
				clientEmail,
				privateKey,
			}),
		});
	} else {
		// Fallback to ADC (e.g., when using gcloud or local emulator)
		admin.initializeApp();
	}
}

export const db = admin.firestore();
export const authAdmin = admin.auth();

export const serverTimestamp = () =>
	admin.firestore.FieldValue.serverTimestamp();

export type Timestamp = admin.firestore.Timestamp;
