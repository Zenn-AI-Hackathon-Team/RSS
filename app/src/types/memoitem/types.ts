export interface MemoItem {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  provider: "youtube" | string;
  fetchStatus: "ok" | "error";
  createdAt: string;
}
