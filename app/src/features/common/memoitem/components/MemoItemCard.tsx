// ../../../common/memoitem/components/MemoItemCard.tsx
"use client";

import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import { MemoItem } from "../../../../types/memoitem/types";

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

  const handleActivate = () => {
    if (selectable) {
      const next = !selected;
      onSelectChange?.(next);
      if (!next) cardRef.current?.blur();
    } else {
      onClick?.(item);
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
          {/* Icon Badge */}
          <div className="bg-amber-300 rounded-lg p-4 flex items-center justify-center min-w-[80px] h-[80px] border-gray-200 border">
            <div className="text-white text-2xl font-bold">
              {Array.from(item.title ?? "")
                .slice(0, 2)
                .join("")}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-black font-semibold text-lg mb-2 transition-colors">
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
