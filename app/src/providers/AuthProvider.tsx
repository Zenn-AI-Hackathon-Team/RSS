"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { auth } from "@/lib/firebase";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	token: string | null;
	getToken: (force?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	token: null,
	getToken: async () => null,
});

export default function AuthProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const getToken = useCallback(async (force?: boolean) => {
		const u = auth.currentUser;
		if (!u) return null;
		const t = await u.getIdToken(!!force);
		setToken(t);
		return t;
	}, []);

	useEffect(() => {
		const unsub = onIdTokenChanged(auth, async (u) => {
			setUser(u);
			setLoading(false);
			if (u) setToken(await u.getIdToken());
			else setToken(null);
		});
		return () => unsub();
	}, []);

	return (
		<AuthContext.Provider value={{ user, loading, token, getToken }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
