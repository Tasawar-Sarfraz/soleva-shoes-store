import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Your account" };
export default function LoginPage() {
  return (
    <div className="section auth-section">
      <div className="auth-art">
        <span className="eyebrow">THE MOTION ATELIER</span>
        <h2>
          Your next
          <br />
          chapter starts
          <br />
          <em>with a step.</em>
        </h2>
        <div className="auth-circle">SV</div>
        <span className="tiny">SOLEVA / BUILT FOR YOUR NEXT MOVE.</span>
      </div>
      <Suspense fallback={<p role="status">Loading sign in…</p>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
