/**
 * Fetches a page of the catalogue for the current URL query string.
 *
 * The URL is the single source of truth for filter state: every facet tick
 * rewrites the query string and this hook reacts to it. That makes a filtered
 * view a real link — which is what the navbar category strip needs, and what
 * the assistant will later drive when chat and filters are wired together.
 */

import { useEffect, useRef, useState } from "react";
import { config } from "../config/config";
import { CatalogResponse } from "../types/catalog";

interface CatalogState {
  data: CatalogResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useCatalog(search: string): CatalogState {
  const [state, setState] = useState<CatalogState>({
    data: null,
    isLoading: true,
    error: null,
  });

  // Filters change fast when someone is ticking boxes; without this an earlier,
  // slower response can land after a later one and show the wrong result set.
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetch(`${config.api.baseUrl}/catalog${search}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`The catalogue server answered ${res.status}.`);
        return res.json();
      })
      .then((data: CatalogResponse) => {
        if (id !== requestId.current) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError" || id !== requestId.current) return;
        setState({
          data: null,
          isLoading: false,
          error:
            "Could not reach the catalogue server. Start it with `node server.js` in mock-server, then reload.",
        });
      });

    return () => controller.abort();
  }, [search]);

  return state;
}
