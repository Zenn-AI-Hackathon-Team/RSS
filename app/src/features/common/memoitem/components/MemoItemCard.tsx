// ../../../common/memoitem/components/MemoItemCard.tsx
"use client";

import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import SmartImage from "@/app/src/components/SmartImage";
import type { MemoItem } from "../../../../types/memoitem/types";
import { useRouter } from "next/navigation";

type Props = {
	item: MemoItem;
	onClick?: (item: MemoItem) => void;
	selectable?: boolean;
	selected?: boolean;
	onSelectChange?: (checked: boolean) => void;
};

const MemoItemCard: React.FC<Props> = ({
	item,
	onClick,
	selectable = false,
	selected = false,
	onSelectChange,
}) => {
	const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

	const handleActivate = () => {
		if (selectable) {
			const next = !selected;
			onSelectChange?.(next);
			if (!next) cardRef.current?.blur();
		} else {
			if (onClick) onClick(item);
			else router.push(`/link/${item.id}`);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleActivate();
		}
	};

	const base = "relative bg-white border-gray-200 cursor-pointer group";
	const a11y = selectable
		? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
		: "";

	// 選択中：青い実線＋リング
	const selectedStyle =
		selectable && selected
			? "border-4 ring-2 ring-blue-500 border-blue-500"
			: "";

	// 未選択（編集モード中）：グレーの実線（←ここを点線から変更）
	const unselectedEditableStyle =
		selectable && !selected ? "border-4 border-gray-400" : "";

	function XIcon({ className = "w-8 h-8" }: { className?: string }) {
		return (
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				xmlns="http://www.w3.org/2000/svg"
				className={className}
				aria-hidden
			>
				<path d="M18.244 2H21l-6.54 7.47L22 22h-6.873l-4.78-6.227L4.84 22H2l7.03-8.03L2 2h6.99l4.33 5.77L18.244 2zm-1.2 18.4h2.11L7.05 3.53H4.83l12.214 16.87z" />
			</svg>
		);
	}

	function InstagramIcon({ className = "w-8 h-8" }: { className?: string }) {
		return (
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				xmlns="http://www.w3.org/2000/svg"
				className={className}
				aria-hidden
			>
				<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM17.75 6A1.25 1.25 0 1 1 16.5 7.25 1.25 1.25 0 0 1 17.75 6z" />
			</svg>
		);
	}

	const provider = item.provider ?? undefined;
	const hasImage = Boolean(item.imageUrl);

	return (
		<div className="relative">
			<Card
				ref={cardRef}
				role={selectable ? "button" : undefined}
				aria-pressed={selectable ? selected : undefined}
				tabIndex={selectable ? 0 : -1}
				onKeyDown={selectable ? handleKeyDown : undefined}
				onClick={handleActivate}
				className={[
					base,
					a11y,
					selectedStyle || unselectedEditableStyle,
					"transition-[border-color,box-shadow]",
				].join(" ")}
			>
				<div className="p-4 flex items-start space-x-4">
					{/* Thumbnail / Fallback */}
					<div className="rounded-lg overflow-hidden flex items-center justify-center w-20 h-20 border-gray-200 border bg-gray-100">
						{hasImage ? (
							<SmartImage
								src={item.imageUrl as string}
								alt={item.title ?? "thumbnail"}
								width={80}
								height={80}
								className="w-full h-full object-cover object-center"
							/>
						) : provider === "x" ? (
							<div className="w-full h-full flex items-center justify-center bg-black text-white">
								<XIcon className="w-8 h-8" />
							</div>
						) : provider === "instagram" ? (
							<div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-400 text-white">
								<InstagramIcon className="w-8 h-8" />
							</div>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-amber-300">
								<div className="text-white text-2xl font-bold">
									{Array.from(item.title ?? "")
										.slice(0, 2)
										.join("")}
								</div>
							</div>
						)}
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<h3 className="text-black font-semibold text-lg mb-2 transition-colors overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
							{item.title}
						</h3>
						<div className="flex items-center space-x-4 text-sm">
							<span className="text-gray-400">{item.createdAt}</span>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default React.memo(MemoItemCard);
