/**
 * Fetches the tutorial library from `GET /tutorials`.
 *
 * Unlike `useCatalog`, this takes no query string and fires once. The library
 * is 87 rows, and the page facets, searches and sorts it client-side, so
 * pushing filter state into the URL here would add a round trip per tick
 * without making anything shareable that isn't already.
 *
 * An empty list is a real answer, not a failure: it means `run_tutorials.py`
 * has not been run yet. The page distinguishes that from a dead server.
 */

import { useEffect, useState } from "react";
import { config } from "../config/config";
import { Tutorial } from "../types";

interface TutorialsState {
  tutorials: Tutorial[];
  isLoading: boolean;
  error: string | null;
}

interface TutorialsResponse {
  tutorials: Tutorial[];
  count: number;
}

export function useTutorials(): TutorialsState {
  const [state, setState] = useState<TutorialsState>({
    tutorials: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${config.api.baseUrl}/tutorials`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`The server answered ${res.status}.`);
        return res.json();
      })
      .then((data: TutorialsResponse) => {
        setState({
          tutorials: Array.isArray(data.tutorials) ? data.tutorials : [],
          isLoading: false,
          error: null,
        });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setState({
          tutorials: [],
          isLoading: false,
          error:
            "Could not reach the tutorial server. Start it with `node server.js` in mock-server, then reload.",
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
