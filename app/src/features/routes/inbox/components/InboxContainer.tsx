"use client";
import React, { useState } from "react";
import InboxHeader from "./InboxHeader";
import InboxList from "./InboxList";
import { MemoItem } from "../../../../types/memoitem/types";

type Props = {
  memoitems: MemoItem[];
};

const InboxContainer: React.FC<Props> = ({ memoitems }) => {
  const [sortBy, setSortBy] = useState("newest");
  const [items, setItems] = useState<MemoItem[]>([...memoitems]);

  const handleSort = (value: string) => {
    setSortBy(value);
    const sorted = [...items];
    switch (value) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }
    setItems(sorted);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pt-6 min-h-screen">
      <InboxHeader sortBy={sortBy} onSortChange={handleSort} />
      <InboxList items={items} />
    </div>
  );
};

export default InboxContainer;
