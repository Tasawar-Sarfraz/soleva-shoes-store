"use client";
export function OrderActions() {
  return (
    <button
      className="btn btn-outline print-hidden"
      onClick={() => window.print()}
    >
      Print order receipt ↗
    </button>
  );
}
