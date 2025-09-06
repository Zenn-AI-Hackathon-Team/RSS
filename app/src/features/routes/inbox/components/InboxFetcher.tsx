"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../providers/AuthProvider";

import { MemoItem } from "@/app/src/types/memoitem/types";
import InboxContainer from "./InboxContainer";

export default function InboxFetcher() {
  const { token, loading } = useAuth();
  const [items, setItems] = useState<MemoItem[]>([]);

  useEffect(() => {
    if (loading || !token) return;
    const qs = new URLSearchParams({
      inbox: "true",
      sort: "desc",
    });
    fetch(`/api/link?${qs.toString()}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [loading, token]);

  return (
    <div>
      <InboxContainer memoitems={items} />
    </div>
  );
}
