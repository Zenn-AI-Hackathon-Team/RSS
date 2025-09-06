"use client";

import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Propsの型を定義
interface SortButtonProps {
	onClick: () => void;
	// sortOrder: 'newest' | 'oldest'; // 将来的な拡張用
}

export const SortButton = ({ onClick }: SortButtonProps) => {
	return (
		<Button variant="outline" onClick={onClick}>
			<ArrowDown className="w-4 h-4 mr-2" />
			新しい順
		</Button>
	);
};
