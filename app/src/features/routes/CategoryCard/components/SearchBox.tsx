"use client";

import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface SearchBoxProps {
    onFocus?: () => void;
}

export const SearchBox = ({ onFocus }: SearchBoxProps) => {
    return (
        <div className="relative">
            <Search className="absolute w-5 h-5 text-slate-400 left-3 top-1/2 -translate-y-1/2" />
            <Input
                placeholder="情報を検索..."
                className="pl-10 bg-slate-100 focus-visible:ring-indigo-500"
                onFocus={onFocus}
            />
        </div>
    );
};
