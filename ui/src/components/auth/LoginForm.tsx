"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { createClient } from "../../lib/supabase/client";
import AuthCard from "./AuthCard";
import { describeAuthError } from "./errors";
import { safeNext } from "./nextPath";

const LoginForm: React.FC = () => {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsBusy(true);
    setError(null);
    const { error: failure } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsBusy(false);

    if (failure) {
      setError(describeAuthError(failure));
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <AuthCard
      title="Sign in"
      lead="Reviews and replies are signed with your account name."
      foot={
        <>
          No account yet?{" "}
          <Link
            className="auth-link"
            href={`/auth/sign-up?next=${encodeURIComponent(next)}`}
          >
            Sign up
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <div className="auth-field__row">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <Link className="auth-link" href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>
          <input
            id="auth-password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-button" disabled={isBusy}>
          {isBusy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
};

export default LoginForm;
