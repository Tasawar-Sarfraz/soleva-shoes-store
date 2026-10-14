"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fields = Object.fromEntries(new FormData(form));
        setBusy(true);
        setError("");
        try {
          const result = await api<{ message: string }>("contact", fields);
          setMessage(result.message);
          form.reset();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Your name
        <input
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
        />
      </label>
      <label>
        How can we help?
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={3000}
        />
      </label>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <button className="btn btn-dark" disabled={busy}>
        {busy ? "Saving…" : "Save your enquiry"} ↗
      </button>
    </form>
  );
}
