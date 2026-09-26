"use client";

/**
 * SearchScreen — problem-first product intelligence results page.
 *
 * Flow:
 *  1. User lands with ?q= from HeroSearch
 *  2. POST /api/websearch streams a WebSearchResponse with 5 DS scores per product
 *  3. Default view: "Compare" (CompareView with radar charts + score bars)
 *     Toggle view: "Cards" (the lightweight grid)
 *  4. Related queries let users pivot without going back
 *  5. No local catalogue references — web search is the only source
 */

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Showdown from "showdown";
import DOMPurify from "dompurify";
import "./search.css";
import CompareView, { DIMENSIONS } from "./CompareView";
import type {
  WebSearchResponse,
  WebResult,
  DSScores,
} from "../../app/api/websearch/route";

// ── Markdown ─────────────────────────────────────────────────────────────────
const converter = new Showdown.Converter({ tables: true, simplifiedAutoLink: true });
function MarkdownHTML({ md }: { md: string }) {
  const html = DOMPurify.sanitize(converter.makeHtml(md));
  return <div className="sr__md" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Mini score strip (shown on the card grid view) ────────────────────────────
const MiniScores: React.FC<{ scores: DSScores; winnerOf: string[] }> = ({
  scores,
  winnerOf,
}) => (
  <div className="sr__card-scores">
    {DIMENSIONS.map((d) => {
      const isWinner = winnerOf.includes(d.key);
      return (
        <span
          key={d.key}
          className={`sr__card-score${isWinner ? " sr__card-score--winner" : ""}`}
          style={{ color: d.color }}
          title={d.description}
        >
          {d.icon}{" "}
          <span className="sr__card-score-num">{scores[d.key]}</span>
        </span>
      );
    })}
  </div>
);

// ── Card (grid view) ──────────────────────────────────────────────────────────
const ResultCard: React.FC<{ result: WebResult; index: number }> = ({
  result,
  index,
}) => (
  <a
    className="sr__card"
    href={result.url || "#"}
    target={result.url ? "_blank" : undefined}
    rel="noopener noreferrer"
    aria-label={`View ${result.title}`}
    style={{ animationDelay: `${index * 55}ms` }}
  >
    <div className="sr__card-media">
      {result.image ? (
        <img src={result.image} alt={result.title} loading="lazy" />
      ) : (
        <span className="sr__card-nophoto">No photo</span>
      )}
    </div>

    <div className="sr__card-body">
      <p className="sr__card-source">{result.source || "Web"}</p>
      <h3 className="sr__card-title">{result.title}</h3>
      {result.brand && <p className="sr__card-brand">{result.brand}</p>}
      <p className="sr__card-desc">{result.description}</p>

      {/* Use-case tags */}
      {result.useCases && result.useCases.length > 0 && (
        <div className="sr__card-usecases">
          {result.useCases.slice(0, 3).map((u) => (
            <span key={u} className="sr__card-usecase">{u}</span>
          ))}
        </div>
      )}

      {/* 5 DS score strip */}
      {result.scores && (
        <MiniScores scores={result.scores} winnerOf={result.winnerOf ?? []} />
      )}

      <div className="sr__card-footer">
        <span className="sr__card-price">{result.price || "Price on request"}</span>
        <span className="sr__card-cta">View →</span>
      </div>
    </div>
  </a>
);

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="sr__card sr__card--skeleton">
    <div className="sr__card-media sr__skel" style={{ aspectRatio: "16/9" }} />
    <div className="sr__card-body">
      <div className="sr__skel sr__skel--line sr__skel--short" />
      <div className="sr__skel sr__skel--line" />
      <div className="sr__skel sr__skel--line sr__skel--medium" />
      <div className="sr__skel sr__skel--line sr__skel--short" />
    </div>
  </div>
);

// ── No-LLM-key help box ───────────────────────────────────────────────────────
const NoKeyHelp = () => (
  <div className="sr__no-key">
    <p className="sr__no-key-title">⚠ LLM key not configured</p>
    <p className="sr__no-key-body">
      Web search requires a Gemini or OpenAI API key. Add one to{" "}
      <code>ui/.env</code> and restart the dev server:
    </p>
    <pre className="sr__no-key-code">
      {`# ui/.env
GEMINI_API_KEY=your_key_here
# or
OPENAI_API_KEY=your_key_here`}
    </pre>
    <p className="sr__no-key-body" style={{ marginTop: 12 }}>
      Get a free Gemini key at{" "}
      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
        style={{ color: "#00c8ff" }}>
        aistudio.google.com/apikey
      </a>{" "}
      — 5 free requests/min on Gemini 2.5 Flash.
    </p>
  </div>
);

// ── Inner screen (uses useSearchParams so must be inside Suspense) ────────────
type ViewMode = "compare" | "cards";

const SearchScreenInner: React.FC = () => {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q")?.trim() ?? "";

  const [searchInput, setSearchInput] = useState(query);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<WebSearchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noKey, setNoKey] = useState(false);
  const [view, setView] = useState<ViewMode>("compare");

  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus("loading");
    setData(null);
    setErrorMsg(null);
    setNoKey(false);

    try {
      const res = await fetch("/api/websearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") {
            setStatus("done");
            break;
          }
          try {
            const { type, payload } = JSON.parse(raw) as {
              type: string;
              payload: unknown;
            };
            if (type === "results") {
              setData(payload as WebSearchResponse);
              setStatus("done");
            } else if (type === "error") {
              const p = payload as { message?: string; hint?: string };
              // Detect "no key" specifically so we can show setup instructions
              if (
                p.message?.toLowerCase().includes("no llm provider") ||
                p.message?.toLowerCase().includes("api key")
              ) {
                setNoKey(true);
              } else {
                setErrorMsg(p.message ?? "Search failed.");
              }
              setStatus("error");
            }
          } catch {
            /* skip malformed frame */
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg("Could not reach the search service. Is the dev server running?");
      setStatus("error");
    }
  }, []);

  // Fire on every new ?q=
  useEffect(() => {
    if (query) runSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const isLoading = status === "loading";
  const hasResults = !!data && data.results.length > 0;

  return (
    <div className="sr">
      {/* ── Sticky search bar ────────────────────────────────────── */}
      <div className="sr__topbar">
        <form className="sr__form" onSubmit={handleSubmit}>
          <input
            className="sr__input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Describe your robotics problem or need…"
            aria-label="Search"
            autoComplete="off"
          />
          <button type="submit" className="sr__submit" disabled={isLoading}>
            {isLoading ? (
              <span className="sr__spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            )}
          </button>
        </form>

        {query && (
          <Link
            href={`/assistant?q=${encodeURIComponent(query)}`}
            className="sr__chatbtn"
          >
            💬 Chat
          </Link>
        )}
      </div>

      {/* ── Page body ────────────────────────────────────────────── */}
      {query && (
        <div className="sr__inner">
          {/* Query + interpreted problem */}
          <p className="sr__label">Analysing</p>
          <h1 className="sr__query">{query}</h1>

          {data?.problemStatement && data.problemStatement !== query && (
            <p className="sr__problem">
              🎯 {data.problemStatement}
            </p>
          )}

          {/* Summary */}
          {data?.summary && (
            <p className="sr__summary">{data.summary}</p>
          )}

          {/* Related queries */}
          {data?.relatedQueries && data.relatedQueries.length > 0 && (
            <div className="sr__related">
              <span className="sr__related-label">Also try</span>
              {data.relatedQueries.map((q) => (
                <Link
                  key={q}
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="sr__related-chip"
                >
                  {q}
                </Link>
              ))}
            </div>
          )}

          {/* Error states */}
          {status === "error" && noKey && <NoKeyHelp />}
          {status === "error" && !noKey && errorMsg && (
            <div className="sr__error">
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <>
              <div className="sr__section-head">
                <p className="sr__section-title">Searching the web…</p>
              </div>
              <div className="sr__grid">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          )}

          {/* Results */}
          {!isLoading && hasResults && (
            <>
              {/* View toggle + count */}
              <div className="sr__section-head">
                <p className="sr__section-title">
                  {data!.results.length} product
                  {data!.results.length !== 1 ? "s" : ""} analysed
                </p>
                <div className="sr__view-toggle">
                  <button
                    type="button"
                    className={`sr__view-btn${view === "compare" ? " sr__view-btn--active" : ""}`}
                    onClick={() => setView("compare")}
                  >
                    ⚖️ Compare
                  </button>
                  <button
                    type="button"
                    className={`sr__view-btn${view === "cards" ? " sr__view-btn--active" : ""}`}
                    onClick={() => setView("cards")}
                  >
                    ◻ Cards
                  </button>
                </div>
              </div>

              {/* Compare view (default) */}
              {view === "compare" && <CompareView data={data!} />}

              {/* Cards view */}
              {view === "cards" && (
                <div className="sr__grid">
                  {data!.results.map((r, i) => (
                    <ResultCard key={r.title + i} result={r} index={i} />
                  ))}
                </div>
              )}

              {/* Raw markdown comparison table (bonus, always shown) */}
              {data!.comparison && (
                <details style={{ marginTop: 32 }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#555",
                      fontFamily: '"Geist Mono", monospace',
                      letterSpacing: ".05em",
                      textTransform: "uppercase",
                      listStyle: "none",
                    }}
                  >
                    ▶ Raw comparison table
                  </summary>
                  <div style={{ marginTop: 16 }}>
                    <MarkdownHTML md={data!.comparison} />
                  </div>
                </details>
              )}
            </>
          )}

          {/* Empty result (model returned nothing) */}
          {!isLoading && status === "done" && !hasResults && !noKey && (
            <div className="sr__empty">
              <p>The AI couldn't identify specific products for this query.</p>
              <p style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
                Try rephrasing — e.g. name a specific robot, use case, or budget.
              </p>
              <Link
                href={`/assistant?q=${encodeURIComponent(query)}`}
                className="sr__fallback-link"
                style={{ marginTop: 12, display: "inline-block" }}
              >
                💬 Ask the AI assistant directly →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no ?q= */}
      {!query && (
        <div className="sr__empty sr__empty--center">
          <p>Enter a problem or product name above to begin.</p>
        </div>
      )}
    </div>
  );
};

// ── Suspense boundary (required for useSearchParams in static prerender) ──────
const SearchScreen: React.FC = () => (
  <Suspense
    fallback={
      <div className="sr">
        <div className="sr__inner">
          <div className="sr__grid">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    }
  >
    <SearchScreenInner />
  </Suspense>
);

export default SearchScreen;
