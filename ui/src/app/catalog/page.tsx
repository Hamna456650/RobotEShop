/**
 * /catalog — The old scraped-data grid is gone.
 *
 * Product discovery now happens through the web-search pipeline at /search.
 * Redirect visitors who land on /catalog (bookmarks, old navbar links) to
 * the new search page, preserving any ?q= parameter so deep links still work.
 */

import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  redirect(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
}
