"use client";

/**
 * HeroSearch — the problem-first homepage.
 *
 * Design intent: the user describes a PROBLEM, not a product.
 * "I need to automate warehouse picking" not "warehouse robot".
 * The platform then finds products, scores them on 5 DS dimensions,
 * and presents a comparison — no scraped data required.
 *
 * Visual: full-viewport dark canvas, subtle grid, two ambient glows,
 * animated typing placeholder cycling through real problem statements,
 * DS feature badges so users know what they'll get.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Mark from "../Mark";
import { config } from "../../config/config";
import "./search.css";

// ── Problem-statement placeholder examples ───────────────────────────────────
const PLACEHOLDERS = [
  "I need a robot arm for a university electronics lab…",
  "Compare humanoid robots under $50,000…",
  "Best quadruped robot for outdoor terrain research…",
  "Which robots support ROS 2 and Python SDK?",
  "Educational robot for 12-year-olds learning to code…",
  "Warehouse automation robot with lowest 5-year TCO…",
  "Affordable robot for AI/LLM research experiments…",
  "Which robot has the strongest developer community?",
];

// ── The 5 DS feature badges ──────────────────────────────────────────────────
const DS_BADGES = [
  { icon: "💰", label: "TCO Score" },
  { icon: "🔗", label: "Ecosystem Depth" },
  { icon: "🚀", label: "Deployment Readiness" },
  { icon: "💬", label: "Community Sentiment" },
  { icon: "🧠", label: "AI Capability" },
];

// ── Quick-start problem chips ────────────────────────────────────────────────
const PROBLEMS = [
  { label: "🎓 University lab robot", query: "best robot for university robotics lab research" },
  { label: "🤖 Compare humanoids", query: "compare top humanoid robots 2024 price performance" },
  { label: "🐕 Outdoor quadruped", query: "quadruped robot for outdoor terrain and research" },
  { label: "🦾 Robotic arm", query: "robotic arm for education and research 6DOF" },
  { label: "📦 Warehouse AMR", query: "autonomous mobile robot for warehouse lowest TCO" },
  { label: "💡 AI research robot", query: "robot platform for LLM and embodied AI research" },
];

// ── Animated typing placeholder ──────────────────────────────────────────────
function useTypingPlaceholder(phrases: string[], active: boolean): string {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (paused) {
      const t = setTimeout(() => setPaused(false), 2000);
      return () => clearTimeout(t);
    }
    const phrase = phrases[phraseIdx];
    if (!deleting) {
      if (charIdx < phrase.length) {
        const t = setTimeout(() => {
          setDisplay(phrase.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, 36);
        return () => clearTimeout(t);
      }
      setPaused(true);
      setDeleting(true);
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplay(phrase.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        }, 16);
        return () => clearTimeout(t);
      }
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
  }, [charIdx, deleting, paused, phraseIdx, phrases, active]);

  return display;
}

// ── Component ────────────────────────────────────────────────────────────────
const HeroSearch: React.FC = () => {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const placeholder = useTypingPlaceholder(PLACEHOLDERS, !focused && !query);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, []);

  const submit = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || isLoading) return;
      setIsLoading(true);
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [router, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(query);
    }
  };

  // ⌘K / Ctrl+K global focus shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="hs">
      {/* ── Ambient background ────────────────────────────────────── */}
      <div className="hs__bg" aria-hidden="true">
        <div className="hs__grid" />
        <div className="hs__glow hs__glow--1" />
        <div className="hs__glow hs__glow--2" />
      </div>

      {/* ── Centre panel ──────────────────────────────────────────── */}
      <div className="hs__centre">

        {/* Brand */}
        <div className="hs__brand">
          <Mark width={28} className="hs__mark" />
          <span className="hs__wordmark">{config.ui.brand}</span>
        </div>

        {/* Headline */}
        <h1 className="hs__headline">
          Describe your problem.<br />We find the best robot.
        </h1>
        <p className="hs__sub">
          AI analyses every product across 5 dimensions no marketplace tracks —
          then shows them side by side so you can decide with confidence.
        </p>

        {/* DS feature badges */}
        <div className="hs__ds-badges" aria-label="Analysis dimensions">
          {DS_BADGES.map((b) => (
            <span key={b.label} className="hs__ds-badge">
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        {/* ── Search box ──────────────────────────────────────────── */}
        <div className={`hs__box${focused ? " hs__box--focused" : ""}`}>
          <textarea
            ref={textareaRef}
            className="hs__input"
            rows={1}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder || "Describe your robotics problem…"}
            aria-label="Describe your robotics need"
            spellCheck={false}
            autoComplete="off"
          />
          <div className="hs__actions">
            <span className="hs__hint" aria-hidden="true">⌘K</span>
            <button
              type="button"
              className={`hs__send${query.trim() ? " hs__send--active" : ""}`}
              onClick={() => submit(query)}
              disabled={!query.trim() || isLoading}
              aria-label="Search and analyse"
            >
              {isLoading ? (
                <span className="hs__spinner" />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Problem chips ────────────────────────────────────────── */}
        <div className="hs__chips" role="list" aria-label="Example problems">
          {PROBLEMS.map((p) => (
            <button
              key={p.query}
              type="button"
              className="hs__chip"
              role="listitem"
              onClick={() => {
                setQuery(p.query);
                submit(p.query);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Nav links ────────────────────────────────────────────── */}
        <nav className="hs__nav" aria-label="Quick links">
          <a href="/tutorials" className="hs__navlink">Tutorials</a>
          <span className="hs__navdot" aria-hidden="true">·</span>
          <a href="/assistant" className="hs__navlink">AI Chat</a>
          <span className="hs__navdot" aria-hidden="true">·</span>
          <a href="/community" className="hs__navlink">Community</a>
        </nav>
      </div>
    </div>
  );
};

export default HeroSearch;
