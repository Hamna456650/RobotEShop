"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { createClient } from "../../lib/supabase/client";
import AuthCard from "./AuthCard";
import { describeAuthError } from "./errors";

const PASSWORD_MIN = 8;

const UpdatePasswordForm: React.FC = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < PASSWORD_MIN) {
      setError(`Use at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (confirm !== password) {
      setError("The two passwords don't match — type them again.");
      return;
    }

    setIsBusy(true);
    setError(null);
    const { error: failure } = await createClient().auth.updateUser({
      password,
    });
    setIsBusy(false);

    if (failure) {
      // "Auth session missing" means the reset link was not followed, or it
      // expired: say that, and where to get another.
      setError(
        failure.message.toLowerCase().includes("session")
          ? "That reset link has expired. Request a new one from the sign-in page."
          : describeAuthError(failure)
      );
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <AuthCard
      title="Choose a new password"
      lead="You'll stay signed in once it's saved."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-password">
            New password
          </label>
          <input
            id="auth-password"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="auth-confirm">
            New password again
          </label>
          <input
            id="auth-confirm"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="auth-button" disabled={isBusy}>
          {isBusy ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthCard>
  );
};

export default UpdatePasswordForm;
