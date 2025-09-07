import { client } from "@/app/src/client/api";
import type {
    CategoryWithCount,
    CreateCategoryRequest,
    CreateCategoryResponse,
    ErrorResponse,
} from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";

/**
 * カテゴリ一覧を取得する
 * 利用可能なカテゴリの一覧と、それぞれのリンク件数を返します。
 * @param getToken 認証トークンを取得する関数
 * @returns カテゴリ一覧（リンク件数付き）
 */
export const getCategories = async (
	getToken: () => Promise<string | null>,
): Promise<CategoryWithCount[]> => {
	try {
		const token = await getToken();
		if (!token) {
			throw new Error("認証が必要です");
		}

		const response: Response = await client.api.categories.$get({
			header: {
				authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error("認証エラー: ログインが必要です");
			}

			let errorMessage = "カテゴリの取得に失敗しました";
			try {
				// responseがok=falseの場合でもjsonメソッドが存在することを前提とする
				const errorData = (await response.json()) as ErrorResponse;
				if (
					typeof errorData === "object" &&
					errorData !== null &&
					"message" in errorData
				) {
					errorMessage = (errorData as { message: string }).message;
				}
			} catch {
				// JSON解析エラーは無視してデフォルトメッセージを使用
			}

			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log(data);

		if (typeof data === "object" && data !== null && "items" in data) {
			return (data as { items: CategoryWithCount[] }).items;
		}

		throw new Error("予期しないレスポンス形式です");
	} catch (error) {
		console.error("getCategories関数でエラーが発生しました:", error);

		if (error instanceof Error) {
			throw error;
		}

		throw new Error("カテゴリの取得中に予期しないエラーが発生しました");
	}
};

export const addCategory = async (
    categoryName: string,
    getToken: () => Promise<string | null>,
    description?: string | null,
): Promise<CreateCategoryResponse> => {
	try {
		const token = await getToken();
		if (!token) {
			throw new Error("認証が必要です");
		}

    const requestBody: CreateCategoryRequest = {
        name: categoryName,
        description: description ?? null,
    };

		const response = await client.api.categories.$post(
			{ json: requestBody },
			{
				headers: {
					authorization: `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			let errorMessage = "カテゴリの作成に失敗しました";

			try {
				const errorData = (await response.json()) as ErrorResponse;
				if (errorData?.message) {
					errorMessage = errorData.message;
				}
			} catch {
				// JSON解析エラーは無視してデフォルトメッセージを使用
			}

			if (response.status === 401) {
				throw new Error("認証エラー: ログインが必要です");
			} else if (response.status === 409) {
				throw new Error("同じ名前のカテゴリが既に存在します");
			}

			throw new Error(errorMessage);
		}

    const data = (await response.json()) as CreateCategoryResponse;

		if (!data || typeof data !== "object" || !data.id || !data.name) {
			throw new Error("予期しないレスポンス形式です");
		}

		// レスポンスにcountが含まれていない場合は0を設定
    return {
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        count: data.count ?? 0,
    };
} catch (error) {
		console.error("addCategory関数でエラーが発生しました:", error);

		if (error instanceof Error) {
			throw error;
		}

		throw new Error("カテゴリの作成中に予期しないエラーが発生しました");
	}
};

export const updateCategoryName = async (
    id: string,
    name: string,
    getToken: () => Promise<string | null>,
    description?: string | null,
) => {
    const token = await getToken();
    if (!token) throw new Error("認証が必要です");

    const body: any = { name };
    if (description !== undefined) body.description = description;

    const res = await client.api.categories[":id"].$patch(
        { param: { id }, json: body },
        { headers: { authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
        let msg = "カテゴリ名の更新に失敗しました";
        try {
            const data = (await res.json()) as ErrorResponse;
            msg = data?.message || msg;
        } catch {}
        if (res.status === 401) msg = "認証エラー: ログインが必要です";
        if (res.status === 404) msg = "指定のカテゴリが見つかりません";
        if (res.status === 409) msg = "同名のカテゴリが既に存在します";
        throw new Error(msg);
    }
    return (await res.json()) as { id: string; name: string; description?: string | null };
};

export const deleteCategory = async (
    id: string,
    getToken: () => Promise<string | null>,
) => {
    const token = await getToken();
    if (!token) throw new Error("認証が必要です");
    const res = await client.api.categories[":id"].$delete(
        { param: { id } },
        { headers: { authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
        let msg = "カテゴリの削除に失敗しました";
        try {
            const data = (await res.json()) as ErrorResponse;
            msg = data?.message || msg;
        } catch {}
        if (res.status === 401) msg = "認証エラー: ログインが必要です";
        if (res.status === 404) msg = "指定のカテゴリが見つかりません";
        throw new Error(msg);
    }
    return true;
};

/**
 * カテゴリ名を更新する
 */
// (duplicate older implementations removed)

// モックデータ
export const initialPosts: PostItem[] = [
	{
		id: "p1",
		title: "Reactの新しい状態管理ライブラリについて",
		url: "#",
		thumbnail:
			"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop&crop=center",
		savedDate: "2025-09-03",
		categoryId: "4",
	},
	{
		id: "p2",
		title: "最高のUXを実現するためのデザイン原則10選",
		url: "#",
		thumbnail:
			"https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop&crop=center",
		savedDate: "2025-09-02",
		categoryId: "1",
	},
	{
		id: "p3",
		title: "知らないと損する、次世代AIツールの活用法",
		url: "#",
		thumbnail:
			"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop&crop=center",
		savedDate: "2025-09-04",
		categoryId: "inbox",
	},
];
