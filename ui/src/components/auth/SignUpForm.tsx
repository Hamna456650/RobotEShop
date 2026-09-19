"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { createClient } from "../../lib/supabase/client";
import AuthCard from "./AuthCard";
import { describeAuthError } from "./errors";
import { safeNext } from "./nextPath";

/* Mirrors the check constraint on profiles.display_name and the project's
   password_min_length, so the server never rejects what the form accepted. */
const NAME_MIN = 2;
const NAME_MAX = 40;
const PASSWORD_MIN = 8;

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const SignUpForm: React.FC = () => {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"), "/community");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // Only reached if email confirmation is turned back on in the project.
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  const validate = (): Errors => {
    const found: Errors = {};
    const trimmedName = name.trim();
    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
      found.name = `Pick a name between ${NAME_MIN} and ${NAME_MAX} characters — it signs your reviews.`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      found.email = "Enter an email address you can receive mail at.";
    }
    if (password.length < PASSWORD_MIN) {
      found.password = `Use at least ${PASSWORD_MIN} characters.`;
    }
    if (confirm !== password) {
      found.confirm = "The two passwords don't match — type them again.";
    }
    return found;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsBusy(true);
    setFailure(null);
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      // Copied into profiles.display_name by the handle_new_user trigger.
      options: { data: { display_name: name.trim() } },
    });
    setIsBusy(false);

    if (error) {
      setFailure(describeAuthError(error));
      return;
    }
    if (!data.session) {
      setAwaitingEmail(true);
      return;
    }
    router.push(next);
    router.refresh();
  };

  const field = (key: keyof Errors) =>
    "auth-input" + (errors[key] ? " auth-input--invalid" : "");

  return (
    <AuthCard
      title="Create an account"
      lead="One name, used on everything you write here."
      foot={
        <>
          Already have one?{" "}
          <Link
            className="auth-link"
            href={`/auth/login?next=${encodeURIComponent(next)}`}
          >
            Sign in
          </Link>
        </>
      }
    >
      {awaitingEmail ? (
        <p className="auth-notice">
          Check your inbox — there is a confirmation link waiting. Once you have
          followed it, sign in.
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-name">
              Display name
            </label>
            <input
              id="auth-name"
              className={field("name")}
              type="text"
              autoComplete="nickname"
              maxLength={NAME_MAX}
              value={name}
              aria-invalid={Boolean(errors.name) || undefined}
              onChange={(event) => setName(event.target.value)}
              placeholder="A name or a handle"
            />
            {errors.name && <p className="auth-error">{errors.name}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className={field("email")}
              type="email"
              autoComplete="email"
              value={email}
              aria-invalid={Boolean(errors.email) || undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && <p className="auth-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className={field("password")}
              type="password"
              autoComplete="new-password"
              value={password}
              aria-invalid={Boolean(errors.password) || undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password && (
              <p className="auth-error">{errors.password}</p>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-confirm">
              Password again
            </label>
            <input
              id="auth-confirm"
              className={field("confirm")}
              type="password"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={Boolean(errors.confirm) || undefined}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {errors.confirm && <p className="auth-error">{errors.confirm}</p>}
          </div>

          {failure && (
            <p className="auth-error" role="alert">
              {failure}
            </p>
          )}

          <button type="submit" className="auth-button" disabled={isBusy}>
            {isBusy ? "Creating…" : "Create account"}
          </button>
        </form>
      )}
    </AuthCard>
  );
};

export default SignUpForm;
