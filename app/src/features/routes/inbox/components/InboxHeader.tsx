import { Inbox } from "lucide-react";
import type React from "react";
import SortButton from "../../../common/sortbutton/components/SortButton";

interface InboxHeaderProps {
	sortBy: string;
	onSortChange: (value: string) => void;
}

const InboxHeader: React.FC<InboxHeaderProps> = ({ sortBy, onSortChange }) => {
	return (
		<div className="flex items-center justify-between mb-6">
			<div className="flex items-center space-x-3">
				<Inbox className="w-8 h-8 text-blue-400" />
				<h1 className="text-3xl font-bold text-black">Inbox</h1>
			</div>
			<SortButton sortBy={sortBy} onSortChange={onSortChange} />
		</div>
	);
};

export default InboxHeader;
