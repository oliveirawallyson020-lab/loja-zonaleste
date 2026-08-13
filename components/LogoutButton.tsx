"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  variant?: "ghost" | "primary";
};

export function LogoutButton({ variant = "ghost" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const baseClass =
    variant === "primary"
      ? "btn-primary-solid text-xs"
      : "btn-ghost text-xs";

  return (
    <button
      type="button"
      className={baseClass}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}

