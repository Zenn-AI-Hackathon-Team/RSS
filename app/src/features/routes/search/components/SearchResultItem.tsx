import Image from "next/image";
import { SEARCH_CONFIG } from "../constants";
import type { SearchResultItemProps } from "../types";

/**
 * 検索結果の個別アイテムコンポーネント
 */
export const SearchResultItem = ({ post, onClick }: SearchResultItemProps) => (
	<button
		onClick={onClick}
		className="flex items-center p-2 space-x-4 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
		type="button"
		aria-label={`${post.title}${SEARCH_CONFIG.ARIA_LABELS.SELECT_RESULT}`}
	>
		<Image
			src={post.thumbnail}
			alt={post.title}
			width={56}
			height={56}
			className="flex-shrink-0 object-cover w-14 h-14 rounded-md bg-slate-200"
		/>
		<div className="overflow-hidden">
			<p className="font-semibold truncate text-slate-800">{post.title}</p>
			<p className="text-sm text-slate-500">{post.savedDate}</p>
		</div>
	</button>
);
