"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// import { X, Plus } from "lucide-react";

// --- 型定義 ---
interface Post {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    categoryId: string;
    tags: string[];
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


export default function PostDetailsScreen({ post, categories, onCategoryChange, onTagsChange }: PostDetailsScreenProps) {
    const [newTag, setNewTag] = useState('');

    const addTag = () => {
        const trimmedTag = newTag.trim().toLowerCase();
        if (trimmedTag && !post.tags.includes(trimmedTag)) {
            onTagsChange(post.id, [...post.tags, trimmedTag]);
            setNewTag('');
        }
    };

    return (
        <div className="p-4 space-y-6">
            <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-auto max-h-52 object-cover rounded-lg border"
            />
            
            <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
            
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
                    <SelectTrigger id="category-select">
                        <SelectValue placeholder="カテゴリを選択..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
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
                        <Badge key={tag} variant="secondary" className="text-base py-1">
                            {tag}
                            <button onClick={() => onTagsChange(post.id, post.tags.filter(t => t !== tag))} className="ml-2 rounded-full hover:bg-black/10 p-0.5">
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                    <div className="relative flex items-center">
                        <Input 
                            placeholder="タグを追加"
                            className="h-9 w-32"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                        />
                         <Button type="button" size="icon" variant="ghost" className="absolute right-0 h-9 w-9" onClick={addTag}>
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>
            </div> */}
        </div>
    );
};
