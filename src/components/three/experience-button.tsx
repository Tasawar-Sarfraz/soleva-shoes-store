"use client";
import { useShopping, type Experience } from "@/lib/client-store";
export function ExperienceButton({
  type,
  productId,
  className,
  children,
}: {
  type: Experience;
  productId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const open = useShopping((s) => s.open);
  return (
    <button className={className} onClick={() => open(type, productId)}>
      {children}
    </button>
  );
}
