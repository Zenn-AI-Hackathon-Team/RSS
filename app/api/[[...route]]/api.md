# Firestore DB 設計 (MVP)

## 概要

* ユーザーごとにデータを管理する
* リンクとカテゴリは `users/{uid}` の配下に保持する
* 検索は Firestore の `where` をベースに部分一致で実装する（MVP向き）

---

## コレクション構造

```
users/{uid}
  ├─ links/{linkId}
  │    url: string
  │    title: string | null
  │    description: string | null
  │    imageUrl: string | null
  │    categoryId: string | null   // null = Inbox
  │    provider: "youtube" | "x" | "instagram" | "generic"
  │    fetchStatus: "ok" | "partial" | "failed"
  │    createdAt: Timestamp
  │    updatedAt: Timestamp
  │
  └─ categories/{categoryId}
       name: string
       createdAt: Timestamp
```

---

## ドキュメント定義

### Links (`users/{uid}/links/{linkId}`)

```ts
type LinkDoc = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;  // OGPの外部URLを保存
  categoryId: string | null; // null の場合は Inbox
  provider: "youtube" | "x" | "instagram" | "generic";
  fetchStatus: "ok" | "partial" | "failed";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

#### 備考

* `url` は正規化して保存（例: UTM パラメータ削除、小文字化など）
* `provider` はドメインに応じて判定（YouTube / X / Instagram / それ以外は generic）
* `fetchStatus` は OGP 取得結果の状態

---

### Categories (`users/{uid}/categories/{categoryId}`)

```ts
type CategoryDoc = {
  name: string;
  createdAt: FirebaseFirestore.Timestamp;
};
```

#### 備考

* 件数カウントは保持しない（UI で表示する際にクエリで数える）
* カテゴリ削除時は、そのカテゴリに属するリンクを `categoryId = null` に更新する

---

## 利用シナリオとクエリ例

### 1. カテゴリ追加

* API: `POST /categories`
* Firestore:

  ```ts
  addDoc(collection(db, "users", uid, "categories"), {
    name,
    createdAt: serverTimestamp(),
  })
  ```

### 2. リンク作成

* API: `POST /links`
* Firestore:
  既存URLチェック → 無ければ追加

  ```ts
  addDoc(collection(db, "users", uid, "links"), {
    url,
    title,
    description,
    imageUrl,
    categoryId: null,
    provider,
    fetchStatus: "ok",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  ```

### 3. リンク移動

* API: `PATCH /links/{id}/category`
* Firestore:

  ```ts
  updateDoc(doc(db, "users", uid, "links", linkId), {
    categoryId: newCategoryId, // null の場合 Inbox
    updatedAt: serverTimestamp(),
  })
  ```

### 4. 検索

* API: `GET /search?q=...`
* Firestore (単純版):

  ```ts
  query(
    collection(db, "users", uid, "links"),
    where("title", ">=", q),
    where("title", "<", q + "\uf8ff")
  )
  ```
* タイトル・カテゴリ名の部分一致検索をサポート
* 将来的には Algolia / MeiliSearch に置き換え可能

---

## インデックス設計

* `users/{uid}/links` に以下のインデックスを作成:

  * `categoryId` + `createdAt`
  * `title` (検索用)

---

## MVPで省略すること

* カテゴリ件数のキャッシュ
* OGP のキャッシュ (外部URL切れ時の対応)
* 高度な全文検索（Algoliaなど）

---
