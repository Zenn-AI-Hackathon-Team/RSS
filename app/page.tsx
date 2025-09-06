"use client";

import CategoryContainer from "@/app/src/features/routes/category/components/CategoryContainer";
import { AddButton } from "@/app/src/features/routes/home/components/AddButton";
import { SearchBox } from "@/app/src/features/routes/home/components/SearchBox";
import { useHomePage } from "@/app/src/features/routes/home/hooks";
import { useAuth } from "@/app/src/providers/AuthProvider";
import InboxFetcher from "./src/features/routes/inbox/components/InboxFetcher";

export default function Page() {
	const { user } = useAuth();

	const {
		posts,
		categories,
		handleAddNewCategory,
		handleSaveLink,
		handleSearchResultClick,
		handleCategoryClick,
	} = useHomePage(user);

	return (
		<main className="relative min-h-screen p-4 space-y-8">
			<SearchBox
				posts={posts}
				categories={categories}
				onResultClick={handleSearchResultClick}
			/>

			<CategoryContainer
				categories={categories}
				posts={posts}
				onCategoryClick={handleCategoryClick}
				onAddNewCategory={handleAddNewCategory}
			/>
			<hr className="border-2 border-slate-200"></hr>

			<InboxFetcher />
			<AddButton onSubmit={handleSaveLink} />
		</main>
	);
}
