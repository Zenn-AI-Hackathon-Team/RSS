// このファイルはサーバーコンポーネントです
// ↓↓↓↓↓↓ この行のパスを修正しました ↓↓↓↓↓↓
import PostDetailsScreen from "app/src/features/routes/CategoryDetailsScreen/components/CategoryDetailsScreen";
//import { Header } from "@/components/Header"; // 必要であればヘッダーをインポート

// --- ダミーのデータ取得関数 ---
// 実際にはAPIやデータベースからデータを取得します
const getPostData = (id: string) => {
    const initialPosts = [
        { id: 'p1', title: 'Reactの新しい状態管理ライブラリについて', url: '#', thumbnail: 'https://placehold.co/400x300/6366f1/ffffff?text=React', savedDate: '2025-09-03', categoryId: '4', tags: ['react', 'frontend', 'javascript'] },
        { id: 'p2', title: '最高のUXを実現するためのデザイン原則10選', url: '#', thumbnail: 'https://placehold.co/400x300/ec4899/ffffff?text=UX/UI', savedDate: '2025-09-02', categoryId: '1', tags: ['ui', 'ux', 'design'] },
    ];
    const initialCategories = [
        { id: 'inbox', name: 'Inbox' }, { id: '1', name: '仕事のアイデア' }, ,{ id: '2', name: '読みたい記事' },{ id: '3', name: '旅行の計画' },{id: '4', name: '技術メモ'},{id: '5', name: 'お気に入りレシピ'},
    ];

    const post = initialPosts.find(p => p.id === id)|| { id: 'p1', title: 'Reactの新しい状態管理ライブラリについて', url: '#', thumbnail: 'https://placehold.co/400x300/6366f1/ffffff?text=React', savedDate: '2025-09-03', categoryId: '4', tags: ['react', 'frontend', 'javascript'] };
    return { post, categories: initialCategories };
}

// サーバーサイドで状態を更新するための関数（サーバーアクション）
async function updateCategory(postId: string, newCategoryId: string) {
    "use server";
    console.log(`サーバーで投稿 ${postId} のカテゴリを ${newCategoryId} に更新しました`);
    // ここでデータベース更新処理などを行う
}

async function updateTags(postId: string, newTags: string[]) {
    "use server";
    console.log(`サーバーで投稿 ${postId} のタグを ${newTags.join(',')} に更新しました`);
    // ここでデータベース更新処理などを行う
}


export default function PostDetailPage({ params }: { params: { id: string } }) {
    // サーバーサイドでURLからIDを取得し、データを準備
    const { post, categories } = getPostData(params.id);

    // // 投稿が見つからない場合の表示
    // if (!post) {
    //     return (
    //         <main className="p-4">
    //             <p>投稿が見つかりません。</p>
    //         </main>
    //     );
    // }

    return (
        <main>
            {/* <Header title="投稿の詳細" showBackButton={true} /> */}
            {/* 取得したデータとサーバーで実行する関数をクライアントコンポーネントに渡す */}
            <PostDetailsScreen 
                post={post} 
                categories={categories} 
                onCategoryChange={updateCategory}
                onTagsChange={updateTags}
            />
        </main>
    );
}

