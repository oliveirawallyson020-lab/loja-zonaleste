"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("from") || "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, senha })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Falha no login.");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao efetuar login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-[0_0_40px_rgba(15,23,42,1)]">
      <h1 className="text-xl font-semibold mb-1">Login</h1>
      <p className="text-sm text-slate-400 mb-6">
        Acesse sua conta para acompanhar suas compras e plano VIP.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="input-root">
          <label className="input-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            className="input-field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-root">
          <label className="input-label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            className="input-field"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary-solid w-full justify-center"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-4">
        Ainda não tem conta?{" "}
        <a
          href="/cadastro"
          className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
        >
          Cadastre-se aqui
        </a>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-slate-400">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}

