"use client";

import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
	title: string;
	count: number;
	onClick: () => void;
}

export const CategoryCard = ({ title, count, onClick }: CategoryCardProps) => {
	return (
		<Card
			onClick={onClick}
			className="cursor-pointer bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 h-25 border border-gray-200"
		>
			<CardContent className="p-2 h-full flex flex-col items-center justify-center">
				<h3 className="font-semibold text-slate-800">{title}</h3>
				<p className="text-sm text-slate-500">投稿数：{count}件</p>
			</CardContent>
		</Card>
	);
};
