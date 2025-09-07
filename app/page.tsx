"use client";

import CategoryContainer from "@/app/src/features/routes/category/components/CategoryContainer";
import { useHomePage } from "@/app/src/features/routes/category/hooks";
import { AddButton } from "@/app/src/features/routes/link-add/components/AddButton";
import { SearchBox } from "@/app/src/features/routes/search/components/SearchBox";
import { useAuth } from "@/app/src/providers/AuthProvider";
import InboxFetcher from "./src/features/routes/inbox/components/InboxFetcher";

export default function Page() {
	const { user } = useAuth();
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
    } = useHomePage(user);

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
                onRefreshCategories={fetchCategories}
            />
			<hr className="border-2 border-slate-200"></hr>

			<InboxFetcher />
			<AddButton onSubmit={handleSaveLink} />
		</main>
	);
}
