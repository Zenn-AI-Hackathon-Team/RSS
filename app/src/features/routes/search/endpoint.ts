import type { User } from "firebase/auth";
import type { z } from "zod";
import type { Link } from "@/app/api/[[...route]]/model/model";
import { client } from "@/app/src/client/api";
import type { PostItem } from "@/app/src/types/postItem/types";

type LinkType = z.infer<typeof Link>;

/**
 * 検索パラメータの型定義
 */
export interface SearchParams {
	q: string;
	limit?: number;
	cursor?: string;
}

/**
 * 検索結果の型定義
 */
export interface SearchResult {
	items: PostItem[];
}

/**
 * リンクを検索する
 * @param params 検索パラメータ
 * @param user Firebase認証ユーザー
 * @returns 検索結果
 */
export const searchLinks = async (
	params: SearchParams,
	user: User,
): Promise<SearchResult> => {
	try {
		if (!params.q || typeof params.q !== "string" || params.q.trim() === "") {
			throw new Error("検索キーワードを入力してください");
		}

		if (!user) {
			throw new Error("ユーザー情報が必要です");
		}

		const token = await user.getIdToken();

		if (!token) {
			throw new Error("ユーザーが認証されていません");
		}

		// クエリパラメータを構築
		const queryParams: { q: string; limit?: string; cursor?: string } = {
			q: params.q.trim(),
		};

		if (params.limit && params.limit > 0 && params.limit <= 100) {
			queryParams.limit = params.limit.toString();
		}

		if (params.cursor) {
			queryParams.cursor = params.cursor;
		}

		const response = await client.api.search.$get(
			{ query: queryParams },
			{
				headers: {
					authorization: `Bearer ${token}`,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "検索に失敗しました");
		}

		const data = await response.json();

		// APIレスポンスをPostItem形式に変換
		const items = data.items.map(transformLinkToPost);

		return { items };
	} catch (error) {
		console.error("searchLinks関数でエラーが発生しました:", error);

		if (error instanceof Error) {
			throw error;
		}

		throw new Error("検索中に予期しないエラーが発生しました");
	}
};

/**
 * APIレスポンスのLinkをPostItem形式に変換する
 * @param linkData API から返されたリンクデータ
 * @returns PostItem形式のデータ
 */
export const transformLinkToPost = (linkData: LinkType): PostItem => {
	return {
		id: linkData.id,
		title: linkData.title || "タイトルなし",
		url: linkData.url,
		thumbnail:
			linkData.imageUrl ||
			"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop&crop=center",
		savedDate: linkData.createdAt
			? new Date(linkData.createdAt).toISOString().split("T")[0]
			: new Date().toISOString().split("T")[0],
		categoryId: linkData.categoryId || "inbox",
	};
};

/**
 * 検索を実行し、結果を取得する簡易版関数
 * @param query 検索キーワード
 * @param user Firebase認証ユーザー
 * @param limit 取得件数（オプション）
 * @returns 検索結果のPostItem配列
 */
export const simpleSearch = async (
	query: string,
	user: User,
	limit = 20,
): Promise<PostItem[]> => {
	const result = await searchLinks({ q: query, limit }, user);
	return result.items;
};

/**
 * ページネーション付きで検索を実行する
 * @param query 検索キーワード
 * @param user Firebase認証ユーザー
 * @param cursor ページネーション用カーソル
 * @param limit 取得件数（オプション）
 * @returns 検索結果
 */
export const searchWithPagination = async (
	query: string,
	user: User,
	cursor?: string,
	limit = 20,
): Promise<SearchResult> => {
	return await searchLinks({ q: query, limit, cursor }, user);
};
