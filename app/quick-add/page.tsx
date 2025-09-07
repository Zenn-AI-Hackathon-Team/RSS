export default function QuickAddPage({
  searchParams,
}: {
  searchParams: { u?: string; url?: string };
}) {
  const raw = searchParams?.u ?? searchParams?.url ?? "";
  return <QuickAddClient sharedUrlRaw={raw ?? ""} />;
}

// Client only UI/logic
import QuickAddClient from "./QuickAddClient";
