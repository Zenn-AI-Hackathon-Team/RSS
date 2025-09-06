"use client";
import React, { useState } from "react";
import InboxHeader from "./InboxHeader";
import MemoItems, {
  MemoItem,
} from "../../../common/memoitems/components/MemoItems";

const InboxContainer: React.FC = () => {
  const [sortBy, setSortBy] = useState("newest");
  const [items, setItems] = useState<MemoItem[]>([
    {
      id: 1,
      title: "Web3時代の新しいビジネスモデル考察",
      date: "2025-09-05",
      category: "Web3",
      tags: ["web3", "blockchain"],
      color: "bg-orange-500",
      icon: "blocks",
    },
    {
      id: 2,
      title: "知らないと損する、次世代AIツールの活用法",
      date: "2025-09-04",
      category: "AI",
      tags: ["ai", "productivity"],
      color: "bg-purple-500",
      icon: "brain",
    },
    {
      id: 3,
      title: "スタートアップの資金調達戦略2025",
      date: "2025-09-03",
      category: "Startup",
      tags: ["funding", "startup"],
      color: "bg-blue-500",
      icon: "trending",
    },
    {
      id: 4,
      title: "リモートワーク時代のチームマネジメント",
      date: "2025-09-02",
      category: "Management",
      tags: ["remote", "team"],
      color: "bg-green-500",
      icon: "users",
    },
  ]);

  const handleSort = (value: string) => {
    setSortBy(value);
    let sortedItems = [...items];

    switch (value) {
      case "newest":
        sortedItems.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case "oldest":
        sortedItems.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case "category":
        sortedItems.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "title":
        sortedItems.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setItems(sortedItems);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 min-h-screen">
      <InboxHeader sortBy={sortBy} onSortChange={handleSort} />
      <MemoItems items={items} />
    </div>
  );
};

export default InboxContainer;
