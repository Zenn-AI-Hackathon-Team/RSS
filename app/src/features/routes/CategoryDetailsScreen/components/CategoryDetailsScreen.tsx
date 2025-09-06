"use client";

import { useState } from "react";
import { ClientTweetCard } from "@/components/magicui/client-tweet-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
// import { X, Plus } from "lucide-react";
import InstagramEmbed from "./InstagramEmbed";

// --- 型定義 ---
interface Post {
	id: string;
	title: string;
	url: string;
	thumbnail: string;
	categoryId: string;
	tags: string[];
	tweetId?: string | null;
	provider?: "youtube" | "x" | "instagram" | "generic";
	videoId?: string | null;
}
interface Category {
	id: string;
	name: string;
}
interface PostDetailsScreenProps {
	post: Post;
	categories: Category[];
	onCategoryChange: (postId: string, newCategoryId: string) => void;
	onTagsChange: (postId: string, newTags: string[]) => void;
}

export default function PostDetailsScreen({
	post,
	categories,
	onCategoryChange,
	onTagsChange,
}: PostDetailsScreenProps) {
	const [newTag, setNewTag] = useState("");

	const addTag = () => {
		const trimmedTag = newTag.trim().toLowerCase();
		if (trimmedTag && !post.tags.includes(trimmedTag)) {
			onTagsChange(post.id, [...post.tags, trimmedTag]);
			setNewTag("");
		}
	};

	return (
		<div className="space-y-6 p-4">
			{post.provider === "youtube" && post.videoId ? (
				<div className="rounded-lg w-full overflow-hidden aspect-video">
					<iframe
						src={`https://www.youtube.com/embed/${post.videoId}`}
						title={post.title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerPolicy="strict-origin-when-cross-origin"
						allowFullScreen
						className="w-full h-full"
					/>
				</div>
			) : post.provider === "instagram" ? (
				<div className="border rounded-lg w-full overflow-hidden">
					<InstagramEmbed url={post.url} hideCaption maxHeight={640} />
				</div>
			) : post.provider === "x" && post.tweetId ? (
				<div className="border rounded-lg w-full overflow-hidden">
					<ClientTweetCard id={post.tweetId} />
				</div>
			) : (
				<img
					src={post.thumbnail}
					alt={post.title}
					className="border rounded-lg w-full h-auto max-h-52 object-cover"
				/>
			)}

			<h1 className="font-bold text-2xl text-slate-900">{post.title}</h1>

			<Button asChild className="w-full h-11 text-base">
				<a href={post.url} target="_blank" rel="noopener noreferrer">
					元リンクを開く
				</a>
			</Button>

			<div className="space-y-2">
				<Label htmlFor="category-select">カテゴリ</Label>
				<Select
					value={post.categoryId}
					onValueChange={(value) => onCategoryChange(post.id, value)}
				>
					{/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
					<SelectTrigger id="category-select">
						<SelectValue placeholder="カテゴリを選択..." />
					</SelectTrigger>
					<SelectContent>
						{categories.map((cat) => (
							<SelectItem key={cat.id} value={cat.id}>
								{cat.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* <div className="space-y-2">　タグ機能
                <Label>タグ</Label>
                <div className="flex flex-wrap items-center gap-2">
                    {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="py-1 text-base">
                            {tag}
                            <button onClick={() => onTagsChange(post.id, post.tags.filter(t => t !== tag))} className="hover:bg-black/10 ml-2 p-0.5 rounded-full">
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                    <div className="relative flex items-center">
                        <Input 
                            placeholder="タグを追加"
                            className="w-32 h-9"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        />
                         <Button type="button" size="icon" variant="ghost" className="right-0 absolute w-9 h-9" onClick={addTag}>
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>
            </div> */}
		</div>
	);
}
