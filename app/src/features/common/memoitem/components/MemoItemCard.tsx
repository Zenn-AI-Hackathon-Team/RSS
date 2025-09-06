// components/memo/MemoItems.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { MemoItem } from "../../../../types/memoitem/types";

type Props = {
  item: MemoItem;
  onClick?: (item: MemoItem) => void;
};

const MemoItemCard: React.FC<Props> = ({ item, onClick }) => {
  return (
    <Card
      className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer group"
      onClick={() => onClick?.(item)}
    >
      <div className="p-4 flex items-start space-x-4">
        <div
          className={`${item.color} rounded-lg p-4 flex items-center justify-center min-w-[80px] h-[80px]`}
        >
          <div className="text-white text-2xl font-bold">
            {item.category === "Web3" && "Web3"}
            {item.category === "AI" && "AI"}
            {item.category === "Startup" && "SU"}
            {item.category === "Management" && "MG"}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>

          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-400">{item.date}</span>

            <div className="flex items-center space-x-2">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MemoItemCard;
