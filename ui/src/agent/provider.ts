/**
 * Which language model answers, and what happens when it cannot.
 *
 * `LLM_PROVIDER` is an ordered list ("gemini,openai"). The route tries each in
 * turn; an attempt that fails before it has streamed any text — bad key, no
 * credits, rate limit, outage — hands over to the next. The AI SDK gives every
 * provider the same `streamText` interface, so switching is one env var.
 *
 * Model ids are read from the environment so a retired id is a config change,
 * not a deploy. Both defaults are each provider's cheap tool-capable tier.
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ProviderName = "gemini" | "openai";

const DEFAULT_ORDER: ProviderName[] = ["gemini", "openai"];

const DEFAULT_MODEL: Record<ProviderName, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-5-mini",
};

function isProviderName(value: string): value is ProviderName {
  return value === "gemini" || value === "openai";
}

export function parseProviderList(raw: string | undefined): ProviderName[] {
  const names = (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(isProviderName);
  const unique = [...new Set(names)];
  return unique.length > 0 ? unique : [...DEFAULT_ORDER];
}

export function modelFor(
  name: ProviderName,
  env: NodeJS.ProcessEnv = process.env
): LanguageModel {
  if (name === "openai") return openai(env.LLM_MODEL_OPENAI || DEFAULT_MODEL.openai);
  return google(env.LLM_MODEL_GEMINI || DEFAULT_MODEL.gemini);
}

export type AttemptOutcome = "completed" | "failed-before-output";

/**
 * Runs `attempt` for each provider until one completes. Returns the provider
 * that did, or null when the list is exhausted. An attempt that has already
 * streamed text must report "completed" even if it later broke — retrying it
 * would duplicate the text the user has seen.
 */
export async function withFailover(
  providers: ProviderName[],
  attempt: (name: ProviderName) => Promise<AttemptOutcome>
): Promise<ProviderName | null> {
  for (const name of providers) {
    if ((await attempt(name)) === "completed") return name;
  }
  return null;
}
