/**
 * The tools one turn gets. `turn` is where search_catalog leaves the cards for
 * the SSE `products` event; the route reads it after the text has streamed.
 * find_video_tutorials is registered only when a SerpAPI key exists, so the
 * model never offers videos it cannot fetch.
 */

import { join } from "node:path";
import { createFileCache, makeFindVideoTutorialsTool, type VideoCache } from "./findVideoTutorials";
import { makeSearchCatalogTool, type TurnState } from "./searchCatalog";

export type { TurnState } from "./searchCatalog";

const CATALOG_API_URL = process.env.CATALOG_API_URL || "http://localhost:8009";

let videoCache: VideoCache | null = null;

function cache(): VideoCache {
  if (!videoCache) videoCache = createFileCache(join(process.cwd(), ".cache", "youtube.json"));
  return videoCache;
}

export function makeTools(turn: TurnState) {
  const search = makeSearchCatalogTool(turn, { fetch, baseUrl: CATALOG_API_URL });
  const key = process.env.SERPAPI_KEY;
  if (!key) return { search_catalog: search };
  return {
    search_catalog: search,
    find_video_tutorials: makeFindVideoTutorialsTool({ fetch, key, cache: cache() }),
  };
}
