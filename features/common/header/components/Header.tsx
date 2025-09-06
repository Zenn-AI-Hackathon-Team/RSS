"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type HeaderProps = {
	title: string;
	showBack?: boolean;
};

export function Header({ title, showBack = false }: HeaderProps) {
	const router = useRouter();
	const pathname = usePathname();

	const hiddenPaths = ["/", "/login", "/register"];
	if (hiddenPaths.includes(pathname)) return null;

	return (
		<header className="flex items-center h-14 px-4">
			{showBack && (
				<button
					type="button"
					onClick={() => router.back()}
					className="mr-4 cursor-pointer"
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
			)}
			<h1 className="flex-1 text-center font-bold text-base">{title}</h1>
			{showBack && <div className="w-9" />}
		</header>
	);
}
