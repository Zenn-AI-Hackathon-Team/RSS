"use client";

import React from "react";
import { Inbox } from "lucide-react";
import MemoItemCard from "../../../common/memoitem/components/MemoItemCard";
import { MemoItem } from "../../../../types/memoitem/types";

type Props = {
  items: MemoItem[];
  onItemClick?: (item: MemoItem) => void;
};

const InboxList: React.FC<Props> = ({ items, onItemClick }) => {
  return (
    <div className="w-full">
      {/* Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <MemoItemCard key={item.id} item={item} onClick={onItemClick} />
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Inbox className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Inboxは空です</p>
        </div>
      )}
    </div>
  );
};

export default InboxList;
