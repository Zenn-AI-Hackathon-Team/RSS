import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface SortProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

const SortButton: React.FC<SortProps> = ({ sortBy, onSortChange }) => {
  const sortOptions = [
    { value: "newest", label: "新しい順" },
    { value: "oldest", label: "古い順" },
    { value: "category", label: "カテゴリー順" },
    { value: "title", label: "タイトル順" },
  ];

  const currentSortLabel = sortOptions.find(
    (option) => option.value === sortBy
  )?.label;
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            {currentSortLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 border-gray-700">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer ${
                sortBy === option.value ? "bg-gray-700 text-white" : ""
              }`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortButton;
