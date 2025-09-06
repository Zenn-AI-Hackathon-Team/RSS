import type { User } from "firebase/auth";
import type { z } from "zod";
import type {
	Link,
	ListLinksQuery,
	ListLinksRes,
} from "@/app/api/[[...route]]/model/model";
import { client } from "@/app/src/client/api";
import type { CategoryItem } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";

type LinkType = z.infer<typeof Link>;
type ListLinksQueryType = z.input<typeof ListLinksQuery>;
type ListLinksResType = z.infer<typeof ListLinksRes>;

/**
 * URLからリンク情報を取得・保存する
 * @param url 保存するURL
 * @param user Firebase認証ユーザー
 * @returns 保存されたリンク情報
 */
export const saveLink = async (url: string, user: User): Promise<LinkType> => {
	const token = await user.getIdToken();

	const response = await client.api.links.$post(
		{ json: { url } },
		{
			headers: {
				authorization: token,
			},
		},
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "リンクの保存に失敗しました");
	}

	return await response.json();
};

/**
 * 指定IDのリンク詳細を取得する
 * @param id リンクID
 * @param user Firebase認証ユーザー
 * @returns 取得したリンク
 */
export const getLink = async (id: string, user: User): Promise<LinkType> => {
	const token = await user.getIdToken();
	const response = await client.api.links[":id"].$get(
		{
			param: { id },
		},
		{ headers: { authorization: `Bearer ${token}` } },
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "リンクの取得に失敗しました");
	}
	return await response.json();
};

/**
 * リンク一覧を取得する
 */
export const listLinks = async (
	user: User,
	params: ListLinksQueryType = {},
): Promise<ListLinksResType["items"]> => {
	const token = await user.getIdToken();
	const response = await client.api.links.$get(
		{
			query: params,
		},
		{ headers: { authorization: token } },
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "リンク一覧の取得に失敗しました");
	}
	const data: ListLinksResType = await response.json();
	return data.items;
};

/**
 * APIレスポンスをPostの形式に変換する
 * @param linkData API から返されたリンクデータ
 * @returns Post形式のデータ
 */
export const transformLinkToPost = (linkData: LinkType): PostItem => {
	return {
		id: linkData.id,
		title: linkData.title || "タイトルなし",
		url: linkData.url,
		thumbnail:
			linkData.imageUrl ||
			"https://placehold.co/400x300/gray/white?text=No+Image",
		savedDate: linkData.createdAt
			? new Date(linkData.createdAt).toISOString().split("T")[0]
			: new Date().toISOString().split("T")[0],
		categoryId: linkData.categoryId || "inbox",
	};
};

/**
 * 新しいカテゴリを作成する
 * @param categories 既存のカテゴリ一覧
 * @param newCategoryName 新しいカテゴリ名
 * @returns 更新されたカテゴリ一覧
 */
export const createNewCategory = (
	categories: CategoryItem[],
	newCategoryName: string,
): CategoryItem[] => {
	if (!newCategoryName || categories.find((c) => c.name === newCategoryName)) {
		throw new Error("そのカテゴリは既に存在します。");
	}

	return [...categories, { id: Date.now().toString(), name: newCategoryName }];
};

/**
 * リンクを保存し、投稿リストに追加する完全な処理
 * @param url 保存するURL
 * @param user Firebase認証ユーザー
 * @returns 変換されたPost
 */
export const saveLinkAndTransform = async (
	url: string,
	user: User,
): Promise<PostItem> => {
	const linkData = await saveLink(url, user);
	return transformLinkToPost(linkData);
};

/**
 * リンク一覧をPostに変換して返す
 */
export const listPosts = async (
	user: User,
	params: ListLinksQueryType = {},
): Promise<PostItem[]> => {
	const items = await listLinks(user, params);
	return items.map(transformLinkToPost);
};

/**
 * 指定IDのリンクをPostに変換して返す
 */
export const getPost = async (id: string, user: User): Promise<PostItem> => {
	const link = await getLink(id, user);
	return transformLinkToPost(link);
};
