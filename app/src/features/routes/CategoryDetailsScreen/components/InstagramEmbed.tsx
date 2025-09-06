"use client";

import { useEffect, useRef } from "react";

declare global {
	interface Window {
		instgrm?: { Embeds?: { process?: () => void } };
	}
}

type Props = {
	url: string;
	hideCaption?: boolean;
	maxWidth?: number; // px
	maxHeight?: number; // px
	overflow?: "hidden" | "auto"; // 高さ制限時の挙動
};

export default function InstagramEmbed({
	url,
	hideCaption = false,
	maxWidth = 540,
	maxHeight = 640,
	overflow = "hidden",
}: Props) {
	const processedRef = useRef(0);

	useEffect(() => {
		const ensureScript = () =>
			new Promise<void>((resolve) => {
				if (window.instgrm?.Embeds?.process) return resolve();
				const existing = document.querySelector<HTMLScriptElement>(
					'script[src="https://www.instagram.com/embed.js"]',
				);
				if (existing) {
					existing.addEventListener("load", () => resolve(), { once: true });
					return;
				}
				const s = document.createElement("script");
				s.async = true;
				s.defer = true;
				s.src = "https://www.instagram.com/embed.js";
				s.addEventListener("load", () => resolve(), { once: true });
				document.body.appendChild(s);
			});

		ensureScript().then(() => {
			// 少し遅延してから処理（DOMが描画されてから）
			setTimeout(() => {
				try {
					window.instgrm?.Embeds?.process?.();
					processedRef.current++;
				} catch {}
			}, 0);
		});
	}, []);

	// Instagram 推奨の blockquote 構造
	return (
		<div className="flex justify-center w-full ig-embed">
			<div style={{ maxWidth, width: "100%", maxHeight, overflow }}>
				<blockquote
					className="instagram-media"
					data-instgrm-permalink={url}
					data-instgrm-version="14"
					data-instgrm-captioned={hideCaption ? "false" : "true"}
					style={{ width: "100%", margin: 0 }}
				>
					<a href={url}>
						{/* anchor 必須。コンテンツは embed.js 側で置き換えられる */}
					</a>
				</blockquote>
			</div>
		</div>
	);
}
