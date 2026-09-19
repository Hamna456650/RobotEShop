/**
 * Where community reviews live.
 *
 * This module is the only file that knows reviews are in `localStorage`. Every
 * function is `async` even though nothing here awaits anything, so that moving
 * to Supabase is a rewrite of this file and nothing else — no caller changes
 * shape, no component grows a loading state it did not already have.
 *
 * THE SUPABASE SWAP
 * =================
 * Replace the bodies below with `supabase.from(…)` calls against:
 *
 *   create table reviews (
 *     id              uuid primary key default gen_random_uuid(),
 *     created_at      timestamptz not null default now(),
 *     author          text not null,
 *     rating          smallint not null check (rating between 1 and 5),
 *     title           text not null,
 *     body            text not null,
 *     board           text not null default '',
 *     months_used     smallint,          -- null = not stated
 *     arrived_working boolean,           -- null = not stated, see types/community.ts
 *     helpful         integer not null default 0,
 *     product         jsonb not null     -- TaggedProduct, denormalised on purpose
 *   );
 *
 *   create table review_replies (
 *     id         uuid primary key default gen_random_uuid(),
 *     review_id  uuid not null references reviews(id) on delete cascade,
 *     created_at timestamptz not null default now(),
 *     author     text not null,
 *     body       text not null
 *   );
 *   create index on review_replies (review_id, created_at);
 *
 * `on delete cascade` is the database saying what `removeReview` below already
 * does by hand: a thread has no meaning once the review it answers is gone.
 * Note there is no `parent_id` — the flat thread is enforced by the schema, not
 * by the UI remembering not to nest.
 *
 * Two things stay on the device even then, because they are facts about this
 * browser rather than about the review: which reviews this visitor has voted
 * helpful, and which ones they wrote. (The author's name used to be a third;
 * it now comes from the signed-in account — see context/AuthContext.)
 * `helpful` itself becomes an RPC so the count is a server-side increment
 * rather than a read-modify-write that two open tabs can lose.
 */

import { Reply, ReplyDraft, ReplyIndex, Review, ReviewDraft } from "../types/community";

const REVIEWS_KEY = "servo.community.reviews.v1";
const REPLIES_KEY = "servo.community.replies.v1";
const VOTED_KEY = "servo.community.voted.v1";
const AUTHORED_KEY = "servo.community.authored.v1";

/**
 * Reading `localStorage` throws outright in some privacy modes rather than
 * returning null, so every access goes through these. A browser that refuses
 * storage gets an empty, working page instead of a blank one.
 */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota or a blocked store. The in-memory list still reflects the change
       for this session; it just will not survive a reload. */
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest first, which is the order every caller wants as its starting point. */
export async function listReviews(): Promise<Review[]> {
  const stored = read<Review[]>(REVIEWS_KEY, []);
  if (!Array.isArray(stored)) return [];
  return [...stored].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addReview(draft: ReviewDraft): Promise<Review> {
  const review: Review = {
    ...draft,
    id: newId(),
    createdAt: new Date().toISOString(),
    helpful: 0,
  };

  const all = read<Review[]>(REVIEWS_KEY, []);
  write(REVIEWS_KEY, [review, ...all]);
  write(AUTHORED_KEY, [review.id, ...read<string[]>(AUTHORED_KEY, [])]);

  return review;
}

/**
 * One vote per review per browser. Returns the whole list because the caller
 * renders a list — handing back a single row would make it stitch the update
 * together itself, and get it wrong the day this is a server round trip.
 */
export async function voteHelpful(id: string): Promise<Review[]> {
  const voted = read<string[]>(VOTED_KEY, []);
  if (voted.includes(id)) return listReviews();

  const all = read<Review[]>(REVIEWS_KEY, []).map((review) =>
    review.id === id ? { ...review, helpful: review.helpful + 1 } : review
  );

  write(REVIEWS_KEY, all);
  write(VOTED_KEY, [id, ...voted]);

  return listReviews();
}

/**
 * There is no sign-in, so "your own" means "written from this browser". That
 * is weak by design: it is enough to let someone take back a review they just
 * posted, and it is replaced wholesale by row-level security under Supabase.
 */
export async function removeReview(id: string): Promise<Review[]> {
  write(
    REVIEWS_KEY,
    read<Review[]>(REVIEWS_KEY, []).filter((review) => review.id !== id)
  );
  // The thread goes with it. Replies answer a review; kept without one they
  // are unreadable, and they would sit in storage forever with nothing able to
  // render them. This is the `on delete cascade` above, done by hand.
  write(
    REPLIES_KEY,
    read<Reply[]>(REPLIES_KEY, []).filter((reply) => reply.reviewId !== id)
  );
  write(
    AUTHORED_KEY,
    read<string[]>(AUTHORED_KEY, []).filter((authored) => authored !== id)
  );
  return listReviews();
}

/* REPLIES
   =======
   Stored flat, exactly as the table above stores them, and grouped on the way
   out. Grouping here rather than in the page means the feed asks for replies
   once for every thread on screen — one `where review_id in (…)` after the
   swap, not one request per card. */

/** Every thread, keyed by review id, oldest first — a conversation reads down. */
export async function listReplies(): Promise<ReplyIndex> {
  const stored = read<Reply[]>(REPLIES_KEY, []);
  if (!Array.isArray(stored)) return {};

  const index: ReplyIndex = {};
  [...stored]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((reply) => {
      if (!index[reply.reviewId]) index[reply.reviewId] = [];
      index[reply.reviewId].push(reply);
    });

  return index;
}

export async function addReply(draft: ReplyDraft): Promise<ReplyIndex> {
  const reply: Reply = {
    ...draft,
    id: newId(),
    createdAt: new Date().toISOString(),
  };

  write(REPLIES_KEY, [...read<Reply[]>(REPLIES_KEY, []), reply]);
  write(AUTHORED_KEY, [reply.id, ...read<string[]>(AUTHORED_KEY, [])]);

  return listReplies();
}

export async function removeReply(id: string): Promise<ReplyIndex> {
  write(
    REPLIES_KEY,
    read<Reply[]>(REPLIES_KEY, []).filter((reply) => reply.id !== id)
  );
  write(
    AUTHORED_KEY,
    read<string[]>(AUTHORED_KEY, []).filter((authored) => authored !== id)
  );
  return listReplies();
}

/* Device-local facts. Synchronous because they never leave this browser, and
   they stay synchronous after the Supabase swap for the same reason. */

export function hasVoted(id: string): boolean {
  return read<string[]>(VOTED_KEY, []).includes(id);
}

/** True for a review *or* a reply written from this browser — ids are unique. */
export function isOwn(id: string): boolean {
  return read<string[]>(AUTHORED_KEY, []).includes(id);
}
