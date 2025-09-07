"use client";

import CategoryContainer from "@/app/src/features/routes/category/components/CategoryContainer";
import { useHomePage } from "@/app/src/features/routes/category/hooks";
import { AddButton } from "@/app/src/features/routes/link-add/components/AddButton";
import { SearchBox } from "@/app/src/features/routes/search/components/SearchBox";
import { useAuth } from "@/app/src/providers/AuthProvider";
import InboxFetcher from "./src/features/routes/inbox/components/InboxFetcher";
import GettingStartedModal from "@/app/src/features/onboarding/components/GettingStartedModal";
import { useEffect, useState } from "react";

export default function Page() {
	const { user } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(false);

    // show only on first login per user (localStorage-based)
    useEffect(() => {
        if (!user) return;
        try {
            const key = `onboardingSeen:${user.uid}`;
            const seen = typeof window !== "undefined" ? localStorage.getItem(key) : null;
            if (!seen) {
                setShowOnboarding(true);
                localStorage.setItem(key, "true");
            }
        } catch {}
    }, [user]);
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
            {/* Onboarding modal */}
            <GettingStartedModal open={showOnboarding} onClose={() => setShowOnboarding(false)} />

            {/* Persistent Help button (bottom-left) */}
            <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border bg-white px-4 py-2 shadow hover:shadow-md text-slate-700"
                aria-label="ヘルプを開く"
                title="ヘルプ"
            >
                {/* Use a small image for the help icon if needed later; placeholder text for now */}
                <span className="text-sm font-medium">ヘルプ</span>
            </button>
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
