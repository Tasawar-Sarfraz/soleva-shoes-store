"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="section empty-state" role="alert">
      <h1>We couldn’t load this view.</h1>
      <p>
        Please retry. If this is a fresh installation, run npm run setup first.
      </p>
      <button className="btn btn-dark" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
