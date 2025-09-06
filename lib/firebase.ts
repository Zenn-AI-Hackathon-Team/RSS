// src/lib/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import {
	browserLocalPersistence,
	getAuth,
	setPersistence,
} from "firebase/auth";

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ここで永続化（自動ログイン）設定。必要なら session に切り替え可。
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ※Emulatorを使うなら（開発時のみ）
// import { connectAuthEmulator } from "firebase/auth";
// if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
//   connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
// }
