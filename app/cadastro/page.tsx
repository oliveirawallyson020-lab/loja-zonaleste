"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [usernameGta, setUsernameGta] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome,
          email,
          usernameGta,
          senha
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Falha no cadastro.");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-900/70 border border-slate-700 rounded-2xl p-6 shadow-[0_0_40px_rgba(15,23,42,1)]">
      <h1 className="text-xl font-semibold mb-1">Criar conta</h1>
      <p className="text-sm text-slate-400 mb-6">
        Cadastre-se para comprar VIP e acompanhar o status das suas ativações.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="input-root">
          <label className="input-label" htmlFor="nome">
            Nome completo
          </label>
          <input
            id="nome"
            className="input-field"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

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
          <label className="input-label" htmlFor="usernameGta">
            Username GTA RP
          </label>
          <input
            id="usernameGta"
            className="input-field"
            type="text"
            required
            value={usernameGta}
            onChange={(e) => setUsernameGta(e.target.value)}
          />
          <p className="input-help">
            Use o mesmo username que você utiliza dentro da Zona Leste RP.
          </p>
        </div>

        <div className="input-root">
          <label className="input-label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            className="input-field"
            type="password"
            minLength={6}
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <div className="input-root">
          <label className="input-label" htmlFor="confirmarSenha">
            Confirmar senha
          </label>
          <input
            id="confirmarSenha"
            className="input-field"
            type="password"
            minLength={6}
            required
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
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
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-4">
        Já tem conta?{" "}
        <a
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
        >
          Entrar
        </a>
        .
      </p>
    </div>
  );
}

