"use client";

/**
 * CompareView — side-by-side product intelligence matrix.
 *
 * Shows all 5 DS dimensions as:
 *  - A horizontal score bar per product per dimension
 *  - SVG radar/pentagon chart (pure CSS + SVG, no charting lib)
 *  - Winner badge on the dimension leader
 *  - Trade-off callout section
 *  - Top-pick recommendation card
 */

import React, { useState } from "react";
import type { WebResult, DSScores, WebSearchResponse } from "../../app/api/websearch/route";

// ── Dimension metadata ────────────────────────────────────────────────────────
export interface DimMeta {
  key: keyof DSScores;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  color: string;
}

export const DIMENSIONS: DimMeta[] = [
  {
    key: "tco",
    label: "TCO Score",
    shortLabel: "TCO",
    icon: "💰",
    description: "5-year total cost of ownership — purchase + power + maintenance + licensing",
    color: "#4ade80",
  },
  {
    key: "ecosystem",
    label: "Ecosystem Depth",
    shortLabel: "Ecosystem",
    icon: "🔗",
    description: "SDK quality, ROS/ROS2 support, community size, open-source health",
    color: "#60a5fa",
  },
  {
    key: "deploymentReadiness",
    label: "Deployment Readiness",
    shortLabel: "Deploy",
    icon: "🚀",
    description: "How fast you can get from box to useful work — setup time, expertise required",
    color: "#f59e0b",
  },
  {
    key: "communitySentiment",
    label: "Community Sentiment",
    shortLabel: "Sentiment",
    icon: "💬",
    description: "NLP-derived signal from Reddit, GitHub Issues, YouTube — real user opinions",
    color: "#a78bfa",
  },
  {
    key: "aiCapability",
    label: "AI / LLM Capability",
    shortLabel: "AI",
    icon: "🧠",
    description: "Onboard AI model quality, edge inference, natural language control, fine-tuning",
    color: "#f87171",
  },
];

// ── Radar / pentagon chart ────────────────────────────────────────────────────
function polarPoint(cx: number, cy: number, angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

const RadarChart: React.FC<{ scores: DSScores; color: string; size?: number }> = ({
  scores,
  color,
  size = 120,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.42;
  const vals = DIMENSIONS.map((d) => scores[d.key] / 100);
  const n = DIMENSIONS.length;
  const angleStep = 360 / n;

  // Concentric guide rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Polygon points for scores
  const points = vals
    .map((v, i) => {
      const pt = polarPoint(cx, cy, i * angleStep, v * maxR);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  // Axis lines + labels
  const axes = DIMENSIONS.map((d, i) => {
    const outer = polarPoint(cx, cy, i * angleStep, maxR);
    const label = polarPoint(cx, cy, i * angleStep, maxR + 14);
    return { outer, label, icon: d.icon };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Radar chart of product scores"
      className="cv__radar"
    >
      {/* Guide rings */}
      {rings.map((r) => {
        const ringPts = DIMENSIONS.map((_, i) => {
          const pt = polarPoint(cx, cy, i * angleStep, r * maxR);
          return `${pt.x},${pt.y}`;
        }).join(" ");
        return (
          <polygon
            key={r}
            points={ringPts}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {axes.map((ax, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={ax.outer.x}
          y2={ax.outer.y}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Score polygon */}
      <polygon
        points={points}
        fill={color + "33"}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {vals.map((v, i) => {
        const pt = polarPoint(cx, cy, i * angleStep, v * maxR);
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={color}
          />
        );
      })}

      {/* Axis icons */}
      {axes.map((ax, i) => (
        <text
          key={i}
          x={ax.label.x}
          y={ax.label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
        >
          {DIMENSIONS[i].icon}
        </text>
      ))}
    </svg>
  );
};

// ── Score bar ─────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{
  score: number;
  color: string;
  isWinner: boolean;
  note: string;
}> = ({ score, color, isWinner, note }) => (
  <div className="cv__bar-wrap" title={note || undefined}>
    <div className="cv__bar-track">
      <div
        className="cv__bar-fill"
        style={{ width: `${score}%`, background: color }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
    <span className="cv__bar-num" style={{ color }}>
      {score}
    </span>
    {isWinner && <span className="cv__winner-badge" aria-label="Category winner">▲</span>}
  </div>
);

// ── Product colour palette ────────────────────────────────────────────────────
const PRODUCT_COLORS = [
  "#00c8ff", "#4ade80", "#f59e0b", "#a78bfa", "#f87171", "#34d399",
];

// ── Overall score (weighted average) ─────────────────────────────────────────
function overallScore(s: DSScores): number {
  return Math.round(
    s.tco * 0.2 +
    s.ecosystem * 0.2 +
    s.deploymentReadiness * 0.2 +
    s.communitySentiment * 0.2 +
    s.aiCapability * 0.2
  );
}

function noteFor(r: WebResult, key: keyof DSScores): string {
  const map: Record<keyof DSScores, string> = {
    tco: r.insights.tcoNote,
    ecosystem: r.insights.ecosystemNote,
    deploymentReadiness: r.insights.deploymentNote,
    communitySentiment: r.insights.sentimentNote,
    aiCapability: r.insights.aiNote,
  };
  return map[key] ?? "";
}

// ── Main component ────────────────────────────────────────────────────────────
interface CompareViewProps {
  data: WebSearchResponse;
}

const CompareView: React.FC<CompareViewProps> = ({ data }) => {
  const { results, topPick, tradeoffs } = data;
  const [activeDim, setActiveDim] = useState<keyof DSScores | "overall">("overall");

  if (!results || results.length === 0) return null;

  // Sort by selected dimension
  const sorted = [...results].sort((a, b) => {
    if (activeDim === "overall") return overallScore(b.scores) - overallScore(a.scores);
    return b.scores[activeDim] - a.scores[activeDim];
  });

  const colorOf = (r: WebResult) =>
    PRODUCT_COLORS[results.indexOf(r) % PRODUCT_COLORS.length];

  return (
    <div className="cv">
      {/* ── Top-pick recommendation ────────────────────────────── */}
      {topPick && (
        <div className="cv__toppick">
          <span className="cv__toppick-badge">▲ Top Pick</span>
          <div className="cv__toppick-body">
            <span className="cv__toppick-name">{topPick.title}</span>
            <span className="cv__toppick-reason">{topPick.reason}</span>
          </div>
        </div>
      )}

      {/* ── Dimension filter tabs ──────────────────────────────── */}
      <div className="cv__tabs" role="tablist" aria-label="Sort by dimension">
        <button
          role="tab"
          aria-selected={activeDim === "overall"}
          className={`cv__tab${activeDim === "overall" ? " cv__tab--active" : ""}`}
          onClick={() => setActiveDim("overall")}
        >
          ⭐ Overall
        </button>
        {DIMENSIONS.map((d) => (
          <button
            key={d.key}
            role="tab"
            aria-selected={activeDim === d.key}
            className={`cv__tab${activeDim === d.key ? " cv__tab--active" : ""}`}
            style={activeDim === d.key ? { borderColor: d.color, color: d.color } : {}}
            onClick={() => setActiveDim(d.key)}
            title={d.description}
          >
            {d.icon} {d.shortLabel}
          </button>
        ))}
      </div>

      {/* ── Side-by-side cards ────────────────────────────────── */}
      <div className="cv__cards">
        {sorted.map((r, rank) => {
          const col = colorOf(r);
          const overall = overallScore(r.scores);
          const isTopPick = topPick?.title === r.title;

          return (
            <div
              key={r.title}
              className={`cv__card${isTopPick ? " cv__card--top" : ""}`}
              style={{ "--card-color": col } as React.CSSProperties}
            >
              {/* Rank badge */}
              <div className="cv__rank" style={{ background: col, color: "#0a0a0a" }}>
                #{rank + 1}
              </div>
              {isTopPick && (
                <div className="cv__toppick-ribbon">▲ Best Pick</div>
              )}

              {/* Header */}
              <div className="cv__card-head">
                <RadarChart scores={r.scores} color={col} size={110} />
                <div className="cv__card-meta">
                  <p className="cv__card-brand">{r.brand}</p>
                  <h3 className="cv__card-name">{r.title}</h3>
                  <p className="cv__card-price">{r.price}</p>
                  <div className="cv__overall-score" style={{ color: col }}>
                    <span className="cv__overall-num">{overall}</span>
                    <span className="cv__overall-label">/100 overall</span>
                  </div>
                  {r.winnerOf.length > 0 && (
                    <div className="cv__wins">
                      {r.winnerOf.map((w) => {
                        const dim = DIMENSIONS.find((d) => d.key === w);
                        return dim ? (
                          <span key={w} className="cv__win-tag" style={{ borderColor: dim.color, color: dim.color }}>
                            {dim.icon} {dim.shortLabel} leader
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="cv__card-desc">{r.description}</p>

              {/* Use cases */}
              {r.useCases.length > 0 && (
                <div className="cv__usecases">
                  {r.useCases.map((u) => (
                    <span key={u} className="cv__usecase">{u}</span>
                  ))}
                </div>
              )}

              {/* 5 DS dimension score bars */}
              <div className="cv__scores">
                {DIMENSIONS.map((dim) => (
                  <div key={dim.key} className="cv__score-row">
                    <span className="cv__score-label">
                      {dim.icon} {dim.shortLabel}
                    </span>
                    <ScoreBar
                      score={r.scores[dim.key]}
                      color={dim.color}
                      isWinner={r.winnerOf.includes(dim.key)}
                      note={noteFor(r, dim.key)}
                    />
                  </div>
                ))}
              </div>

              {/* Insights accordion */}
              <details className="cv__insights">
                <summary className="cv__insights-toggle">Why these scores?</summary>
                <ul className="cv__insights-list">
                  {DIMENSIONS.map((dim) => {
                    const note = noteFor(r, dim.key);
                    if (!note) return null;
                    return (
                      <li key={dim.key} className="cv__insight-item">
                        <span style={{ color: dim.color }}>{dim.icon}</span>{" "}
                        <strong>{dim.shortLabel}:</strong> {note}
                      </li>
                    );
                  })}
                  {r.annualMaintenanceUsd != null && (
                    <li className="cv__insight-item">
                      🔧 <strong>Annual maintenance:</strong> ~${r.annualMaintenanceUsd.toLocaleString()}/yr
                    </li>
                  )}
                  {r.mtbfHours != null && (
                    <li className="cv__insight-item">
                      ⏱ <strong>MTBF:</strong> ~{r.mtbfHours.toLocaleString()} hours
                    </li>
                  )}
                </ul>
              </details>

              {/* CTA */}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cv__cta"
                  style={{ borderColor: col, color: col }}
                >
                  View product →
                </a>
              )}

              {/* Key specs */}
              {r.specs.length > 0 && (
                <ul className="cv__specs">
                  {r.specs.map((s, i) => (
                    <li key={i} className="cv__spec">{s}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Trade-offs callout ────────────────────────────────── */}
      {tradeoffs.length > 0 && (
        <div className="cv__tradeoffs">
          <h3 className="cv__tradeoffs-title">⚖️ Key decisions you face</h3>
          <ul className="cv__tradeoffs-list">
            {tradeoffs.map((t, i) => (
              <li key={i} className="cv__tradeoff">{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompareView;
