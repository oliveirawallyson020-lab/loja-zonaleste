"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { PIX_KEY } from "../../lib/config";

const PLAN_INFO: Record<
  string,
  { nome: string; descricao: string; preco: number }
> = {
  VIP_SEMANAL: {
    nome: "VIP Semanal",
    descricao: "Ideal para testar os benefícios VIP.",
    preco: 15
  },
  VIP_MENSAL: {
    nome: "VIP Mensal",
    descricao: "O clássico. Melhor custo-benefício.",
    preco: 35
  },
  CARRO_BLINDADO_SEMANAL: {
    nome: "Carro Blindado (7 Dias)",
    descricao: "Aluguel semanal de veículo blindado.",
    preco: 20
  },
  CARRO_BLINDADO_MENSAL: {
    nome: "Carro Blindado (30 Dias)",
    descricao: "Acesso mensal ao blindado com desconto.",
    preco: 50
  },
  MOTO_SEMANAL: {
    nome: "Moto VIP (7 Dias)",
    descricao: "Agilidade máxima nas ruas por 7 dias.",
    preco: 15
  },
  MOTO_MENSAL: {
    nome: "Moto VIP (30 Dias)",
    descricao: "Domine as ruas o mês inteiro.",
    preco: 35
  }
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plano = (searchParams.get("plano") || "VIP_MENSAL").toUpperCase();
  const planoInfo = PLAN_INFO[plano] ?? PLAN_INFO.VIP_MENSAL;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Envie o comprovante do PIX para continuar.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("plano", plano);
      formData.append("comprovante", file);

      const res = await fetch("/api/purchase", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            "Não foi possível registrar sua compra. Verifique se está logado."
        );
      }

      setSuccess(
        "Compra registrada com sucesso! Seu status está como AGUARDANDO APROVAÇÃO. Acompanhe em Minha Conta."
      );
      setFile(null);
      router.push("/minha-conta");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar compra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 grid gap-6 md:grid-cols-[2fr,1.5fr]">
      <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6">
        <h1 className="text-xl font-semibold mb-2">Finalizar compra</h1>
        <p className="text-sm text-slate-400 mb-4">
          Envie o comprovante do PIX para registrar sua compra. A aprovação é
          feita manualmente pela staff.
        </p>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-200">
            Plano selecionado
          </h2>
          <p className="text-base font-semibold text-indigo-300">
            {planoInfo.nome}
          </p>
          <p className="text-xs text-slate-400 max-w-md">
            {planoInfo.descricao}
          </p>
          <p className="mt-2 text-lg font-bold">
            R$ {planoInfo.preco.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="mb-4 text-sm">
          <p className="font-semibold mb-1">Instruções de pagamento via PIX</p>
          <ol className="list-decimal list-inside text-slate-300 space-y-1">
            <li>Abra o aplicativo do seu banco.</li>
            <li>Escolha pagar com PIX (chave aleatória).</li>
            <li>
              Use a chave abaixo e pague exatamente o valor do plano
              selecionado.
            </li>
            <li>Salve o comprovante em imagem ou PDF.</li>
            <li>Faça o upload do comprovante no formulário.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-root">
            <label className="input-label" htmlFor="comprovante">
              Comprovante do PIX
            </label>
            <input
              id="comprovante"
              className="input-field"
              type="file"
              accept="image/*,application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="input-help">
              Formatos aceitos: imagem (JPG, PNG, etc.) ou PDF. Tamanho máximo
              recomendado: 5MB.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary-solid w-full justify-center"
            disabled={loading}
          >
            {loading ? "Enviando comprovante..." : "Enviar comprovante"}
          </button>
        </form>
      </section>

      <section className="bg-slate-950/70 border border-purple-700/60 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">
          Chave PIX oficial
        </h2>
        <p className="text-xs text-slate-400 mb-1">
          Use exatamente esta chave na hora do pagamento:
        </p>
        <pre className="text-xs bg-slate-900 border border-purple-600/70 rounded-lg p-3 text-purple-200 break-all">
          {PIX_KEY}
        </pre>

        <div className="mt-4 text-xs text-slate-400 space-y-1">
          <p>
            • Após o envio do comprovante, sua compra fica com status{" "}
            <span className="badge-status badge-status-AGUARDANDO">
              Aguardando
            </span>
            .
          </p>
          <p>
            • A staff irá validar manualmente o pagamento e aprovar ou recusar
            a compra.
          </p>
          <p>
            • Em caso de aprovação, você receberá um{" "}
            <strong>token VIP único</strong> por e-mail junto com as
            instruções de ativação.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-slate-400">Carregando checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

