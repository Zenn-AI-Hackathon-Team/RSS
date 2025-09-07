"use client";

import { useRef } from "react";
import CategoryContainer from "@/app/src/features/routes/category/components/CategoryContainer";
import { useHomePage } from "@/app/src/features/routes/category/hooks";
import { AddButton } from "@/app/src/features/routes/link-add/components/AddButton";
import { SearchBox } from "@/app/src/features/routes/search/components/SearchBox";
import { useAuth } from "@/app/src/providers/AuthProvider";
import InboxFetcher, {
	type InboxFetcherRef,
} from "./src/features/routes/inbox/components/InboxFetcher";

export default function Page() {
	const { user } = useAuth();
	const inboxRef = useRef<InboxFetcherRef>(null);

	// Inbox更新関数
	const refreshInbox = async () => {
		if (inboxRef.current) {
			await inboxRef.current.refresh();
		}
	};

	const {
		posts,
		categories,
		loading,
		error,
		handleAddNewCategory,
		handleSaveLink,
		handlePostClick,
		handleCategoryClick,
		fetchCategories,
	} = useHomePage(user, refreshInbox);

	return (
		<main className="relative min-h-screen p-4 space-y-8">
			<SearchBox
				posts={posts}
				categories={categories}
				onResultClick={handlePostClick}
			/>

			<CategoryContainer
				categories={categories}
				posts={posts}
				onCategoryClick={handleCategoryClick}
				onAddNewCategory={handleAddNewCategory}
				loading={loading}
				error={error}
			/>
			<hr className="border-2 border-slate-200"></hr>

			<InboxFetcher ref={inboxRef} />
			<AddButton onSubmit={handleSaveLink} />
		</main>
	);
}
