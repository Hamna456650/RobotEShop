"use client";

/**
 * ModernChatbot — replaces the legacy Chatbox.
 *
 * Features:
 *  - Dark cinematic UI matching the Unitree-inspired theme
 *  - Clickable links in assistant messages (rendered as actual <a> tags)
 *  - Text-to-Speech (Web Speech API): every assistant message has a
 *    🔊 speak button; global mic button listens for voice input
 *  - Product cards (robot-row) with direct seller links
 *  - BOM table with Buy → links
 *  - Smooth typing animation for streaming tokens
 *  - Auto-scroll to latest message
 *  - Reset / new conversation button
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Showdown from "showdown";
import DOMPurify from "dompurify";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";

import BomCard from "../chatbox/BomCard";
import Mark from "../Mark";
import { config } from "../../config/config";
import type { RobotCard } from "../../types";
import type { BomResult } from "../../agent/tools/generateBom";
import "./chatbot.css";

// ── Markdown converter ────────────────────────────────────────────────────────
const converter = new Showdown.Converter({
  simplifiedAutoLink: true,
  openLinksInNewWindow: true,
  simpleLineBreaks: true,
  tables: true,
  strikethrough: true,
});

function renderMarkdown(text: string): string {
  const html = converter.makeHtml(text);
  // DOMPurify: allow target="_blank" on links (added by Showdown's openLinksInNewWindow)
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ["target", "rel"],
  });
}

// ── Speech Recognition type shims ────────────────────────────────────────────
// The Web Speech API types (SpeechRecognition, SpeechRecognitionEvent) are
// present in lib.dom.d.ts when `"dom"` is in tsconfig lib, but the constructor
// is on `window` as `SpeechRecognition` or `webkitSpeechRecognition`. We shim
// both here so TypeScript is happy without an extra @types package.
interface SpeechRecognitionResultItem {
  transcript: string;
}
interface SpeechRecognitionResultList {
  0: SpeechRecognitionResultItem[];
}
interface SpeechRecognitionEvt {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvt) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionCtor {
  new(): SpeechRecognitionInstance;
}
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}
let currentUtterance: SpeechSynthesisUtterance | null = null;

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const plain = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const utter = new SpeechSynthesisUtterance(plain);
  utter.rate = 1.05;
  utter.pitch = 1;
  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  currentUtterance = null;
}

// ── Message types ─────────────────────────────────────────────────────────────
type MsgRole =
  | "user"
  | "assistant"
  | "loader"
  | "product_row"
  | "bom_row"
  | "user_image";

interface ChatMsg {
  id: string;
  role: MsgRole;
  content: string | RobotCard[] | BomResult;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ── Robot card (mini) ─────────────────────────────────────────────────────────
const MiniRobotCard: React.FC<{ card: RobotCard }> = ({ card }) => {
  const seller = card.sellers?.[0];
  const href = seller
    ? (seller as unknown as { sourceUrl?: string }).sourceUrl
    : undefined;

  return (
    <a
      className={`mc__rcard${href ? "" : " mc__rcard--nolink"}`}
      href={href ?? "#"}
      target={href ? "_blank" : undefined}
      rel="noopener noreferrer"
    >
      <div className="mc__rcard-img">
        {card.image ? (
          <img src={card.image} alt={card.name} loading="lazy" />
        ) : (
          <span className="mc__rcard-nophoto">No photo</span>
        )}
      </div>
      <div className="mc__rcard-body">
        <p className="mc__rcard-brand">{card.brand}</p>
        <h4 className="mc__rcard-name">{card.name}</h4>
        <div className="mc__rcard-chips">
          {card.platforms.slice(0, 2).map((p) => (
            <span key={p} className="mc__rcard-chip">{p}</span>
          ))}
          {card.skill && (
            <span className="mc__rcard-chip mc__rcard-chip--skill">{card.skill}</span>
          )}
        </div>
        <div className="mc__rcard-price">
          <span className="mc__rcard-amount">{card.priceLabel}</span>
          {card.offerCount > 1 && (
            <span className="mc__rcard-offers">{card.offerCount} sellers</span>
          )}
        </div>
      </div>
    </a>
  );
};

// ── Typing indicator ───────────────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <span className="mc__typing" aria-label="Typing">
    <span /><span /><span />
  </span>
);

// ── Single message bubble ─────────────────────────────────────────────────────
interface BubbleProps {
  msg: ChatMsg;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
}

const Bubble: React.FC<BubbleProps> = ({ msg, onSpeak, isSpeaking }) => {
  if (msg.role === "loader") {
    return (
      <div className="mc__row mc__row--assistant">
        <div className="mc__avatar">
          <Mark width={16} className="mc__avatar-mark" />
        </div>
        <div className="mc__bubble mc__bubble--assistant">
          <TypingDots />
        </div>
      </div>
    );
  }

  if (msg.role === "user") {
    return (
      <div className="mc__row mc__row--user">
        <div className="mc__bubble mc__bubble--user">
          {msg.content as string}
        </div>
      </div>
    );
  }

  if (msg.role === "assistant") {
    const html = renderMarkdown(msg.content as string);
    return (
      <div className="mc__row mc__row--assistant">
        <div className="mc__avatar">
          <Mark width={16} className="mc__avatar-mark" />
        </div>
        <div className="mc__bubble mc__bubble--assistant">
          <div
            className="mc__prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <button
            type="button"
            className={`mc__speak${isSpeaking ? " mc__speak--active" : ""}`}
            onClick={() => onSpeak(msg.content as string)}
            aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
            title={isSpeaking ? "Stop" : "Read aloud"}
          >
            {isSpeaking ? <StopCircleIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
          </button>
        </div>
      </div>
    );
  }

  if (msg.role === "product_row") {
    const cards = msg.content as RobotCard[];
    return (
      <div className="mc__row mc__row--assistant">
        <div className="mc__avatar">
          <Mark width={16} className="mc__avatar-mark" />
        </div>
        <div className="mc__cards-scroll">
          {cards.map((c) => (
            <MiniRobotCard key={c.id} card={c} />
          ))}
        </div>
      </div>
    );
  }

  if (msg.role === "bom_row") {
    return (
      <div className="mc__row mc__row--assistant">
        <div className="mc__avatar">
          <Mark width={16} className="mc__avatar-mark" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <BomCard bom={msg.content as BomResult} />
        </div>
      </div>
    );
  }

  return null;
};

// ── Main component ────────────────────────────────────────────────────────────
export interface ModernChatbotProps {
  /** If provided, sent automatically as the first message. */
  initialQuery?: string;
  /** Extra CSS class (e.g. when embedded in a widget vs full screen). */
  className?: string;
}

const ModernChatbot: React.FC<ModernChatbotProps> = ({
  initialQuery,
  className = "",
}) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInit = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Input auto-grow
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  // TTS
  const handleSpeak = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) {
        stopSpeaking();
        setSpeakingId(null);
      } else {
        stopSpeaking();
        setSpeakingId(id);
        speakText(text);
        // Reset badge when done
        const utter = currentUtterance;
        if (utter) {
          utter.onend = () => setSpeakingId(null);
        }
      }
    },
    [speakingId]
  );

  // Voice input (Speech Recognition)
  const toggleMic = useCallback(() => {
    const SR: SpeechRecognitionCtor | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvt) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Core send
  const sendMessage = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || isLoading) return;

      const userId =
        sessionStorage.getItem("shopping_user_id") ??
        String(Date.now() * 1000 + Math.floor(Math.random() * 1000));
      sessionStorage.setItem("shopping_user_id", userId);

      setIsLoading(true);
      setInput("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      const loaderId = uid();
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: q },
        { id: loaderId, role: "loader", content: "" },
      ]);

      const url = `${config.api.baseUrl}${config.api.endpoints.stream}`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            query: q,
            guardrails: config.features.guardrails.defaultState,
            image: "",
            image_bool: false,
          }),
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        const assistantId = uid();

        // Replace loader with empty assistant bubble
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loaderId
              ? { ...m, id: assistantId, role: "assistant" as MsgRole, content: "" }
              : m
          )
        );

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (raw === "[DONE]") { setIsLoading(false); break; }

            try {
              const { type, payload } = JSON.parse(raw);

              if (type === "content") {
                fullText += payload as string;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullText }
                      : m
                  )
                );
              } else if (type === "products") {
                setMessages((prev) => [
                  ...prev,
                  { id: uid(), role: "product_row", content: payload as RobotCard[] },
                ]);
              } else if (type === "bom") {
                setMessages((prev) => [
                  ...prev,
                  { id: uid(), role: "bom_row", content: payload as BomResult },
                ]);
              }
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        console.error("[ModernChatbot]", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loaderId
              ? {
                  ...m,
                  role: "assistant" as MsgRole,
                  content: "Sorry, I couldn't reach the server. Please try again.",
                }
              : m
          )
        );
        toast.error("Connection error. Check that the mock server is running.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // Reset
  const handleReset = () => {
    sessionStorage.removeItem("shopping_user_id");
    stopSpeaking();
    setSpeakingId(null);
    setMessages([]);
    setInput("");
  };

  // Send initial query once
  useEffect(() => {
    if (initialQuery && !hasInit.current) {
      hasInit.current = true;
      sendMessage(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className={`mc ${className}`}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mc__header">
        <div className="mc__header-brand">
          <Mark width={18} className="mc__header-mark" />
          <span className="mc__header-title">{config.ui.assistantName}</span>
        </div>
        <button
          type="button"
          className="mc__reset"
          onClick={handleReset}
          title="New conversation"
          aria-label="New conversation"
        >
          <RefreshIcon fontSize="small" />
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div className="mc__messages" role="log" aria-live="polite" aria-atomic="false">
        {messages.length === 0 && (
          <div className="mc__welcome">
            <Mark width={36} className="mc__welcome-mark" />
            <p className="mc__welcome-title">Hi, I&rsquo;m {config.ui.assistantName}</p>
            <p className="mc__welcome-sub">
              Ask me about robots, parts, prices, or say{" "}
              <em>&ldquo;build me a line-following robot&rdquo;</em> for a full
              parts list.
            </p>
            <div className="mc__welcome-chips">
              {[
                "What is ROS 2?",
                "Show me servo motors under Rs 2,000",
                "Build me an obstacle avoidance robot",
                "Compare TurtleBot3 vs JetBot",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="mc__welcome-chip"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <Bubble
            key={msg.id}
            msg={msg}
            onSpeak={(text) => handleSpeak(msg.id, text)}
            isSpeaking={speakingId === msg.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────── */}
      <div className="mc__footer">
        <div className={`mc__inputbox${isLoading ? " mc__inputbox--loading" : ""}`}>
          <textarea
            ref={inputRef}
            className="mc__input"
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about robots…"
            aria-label="Message"
            disabled={isLoading}
            spellCheck={false}
            autoComplete="off"
          />
          <div className="mc__input-btns">
            <button
              type="button"
              className={`mc__mic${isListening ? " mc__mic--active" : ""}`}
              onClick={toggleMic}
              aria-label={isListening ? "Stop listening" : "Voice input"}
              title={isListening ? "Stop" : "Voice input"}
            >
              {isListening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
            </button>
            <button
              type="button"
              className={`mc__send${input.trim() ? " mc__send--active" : ""}`}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <SendIcon fontSize="small" />
            </button>
          </div>
        </div>
        <p className="mc__disclaimer">
          Powered by {config.ui.brand} · Results may not be complete
        </p>
      </div>
    </div>
  );
};

export default ModernChatbot;
