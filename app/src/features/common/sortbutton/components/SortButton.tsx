import { ChevronDown } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
		(option) => option.value === sortBy,
	)?.label;
	return (
		<div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="default" // variantをoutlineからdefaultに
						className="flex items-center bg-[#7268EC] text-white hover:bg-[#5a4ee0] focus:ring-2 focus:ring-offset-2 focus:ring-[#7268EC] transition-colors"
					>
						<ChevronDown className="w-4 h-4 mr-2" />
						{currentSortLabel}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="bg-[#7268EC] border-[#5a4ee0] text-white w-48">
					{sortOptions.map((option) => (
						<DropdownMenuItem
							key={option.value}
							onClick={() => onSortChange(option.value)}
							className={`cursor-pointer focus:bg-[#5a4ee0] focus:text-white ${
								sortBy === option.value ? "bg-[#5a4ee0]" : ""
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
