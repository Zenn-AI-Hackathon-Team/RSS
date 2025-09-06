"use client";

import { Card, CardContent } from "@/components/ui/card";

// Propsの型を定義
interface CategoryCardProps {
  title: string;
  count: number;
  onClick: () => void;
}

export const CategoryCard = ({ title, count, onClick }: CategoryCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50"
    >
      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">投稿数：{count}件</p>
      </CardContent>
    </Card>
  );
};