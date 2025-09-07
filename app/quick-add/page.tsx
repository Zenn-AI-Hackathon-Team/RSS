export default async function QuickAddPage({
  searchParams,
}: {
  searchParams?: Promise<any>;
}) {
  const params = (searchParams ? await searchParams : {}) as Record<string, unknown>;
  const pick = (k: string) => {
    const v = params?.[k] as unknown;
    if (Array.isArray(v)) return (v[0] as string) ?? "";
    return (v as string) ?? "";
  };
  const raw = pick("u") || pick("url") || "";
  return <QuickAddClient sharedUrlRaw={raw} />;
}

// Client only UI/logic
import QuickAddClient from "./QuickAddClient";
