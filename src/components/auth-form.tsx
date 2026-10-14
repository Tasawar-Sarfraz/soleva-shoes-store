"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
export function AuthForm() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
  return (
    <div className="auth-card">
      <span className="eyebrow">YOUR SOLEVA ACCOUNT</span>
      <h1>{register ? "Make your next move." : "Welcome back."}</h1>
      <p>
        {register
          ? "Save your designs, addresses, and order history."
          : "A place for your saved designs and your next moves."}
      </p>
      <form
        className="stack-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          const form = new FormData(e.currentTarget);
          const email = String(form.get("email"));
          const password = String(form.get("password"));
          const result = register
            ? await authClient.signUp.email({
                email,
                password,
                name: String(form.get("name")),
              })
            : await authClient.signIn.email({ email, password });
          if (result.error) {
            setError(result.error.message || "Unable to sign in.");
            setBusy(false);
          } else {
            router.push(
              next?.startsWith("/") && !next.startsWith("//")
                ? next
                : "/account",
            );
            router.refresh();
          }
        }}
      >
        {register && (
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
        )}
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            aria-label="Password"
            aria-describedby="password-requirements"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={10}
            maxLength={128}
          />
          <span className="small muted" id="password-requirements">
            At least 10 characters.
          </span>
        </label>
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-dark full-width" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <button
        className="text-btn auth-switch"
        onClick={() => {
          setRegister(!register);
          setError("");
        }}
      >
        {register
          ? "Already have an account? Sign in"
          : "New here? Create an account"}{" "}
        ↗
      </button>
      <p className="small muted">
        This local demo stores account details securely in SQLite. No email
        delivery is configured.
      </p>
      <Link href="/shop" className="text-btn small">
        ← Back to the collection
      </Link>
    </div>
  );
}
