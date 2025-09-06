"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../app/src/providers/AuthProvider";
import { Header } from "../../src/features/common/header/components/Header";
import CategoryViewContainer from "../../src/features/routes/category-item-list/components/CategoryViewContainer";
import { MemoItem } from "@/app/src/types/memoitem/types";

export default function ClientPage({ categoryId }: { categoryId: string }) {
  const { token, loading } = useAuth();
  const [items, setItems] = useState<MemoItem[]>([]);

  useEffect(() => {
    if (loading || !token) return;
    const qs = new URLSearchParams({
      categoryId,
      inbox: "false",
      sort: "desc",
    });
    fetch(`/api/link?${qs.toString()}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [loading, token, categoryId]);

  return (
    <div>
      <Header title="Category View" />
      <CategoryViewContainer memoitems={items} />
    </div>
  );
}
