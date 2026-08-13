"use client";

import { useEffect, useMemo, useState } from "react";
import { LogoutButton } from "../../components/LogoutButton";

type Status = "AGUARDANDO" | "APROVADO" | "RECUSADO" | "EXPIRADO" | "TODOS";
type Plano = "VIP_SEMANAL" | "VIP_MENSAL" | "CARRO_BLINDADO_SEMANAL" | "CARRO_BLINDADO_MENSAL" | "MOTO_SEMANAL" | "MOTO_MENSAL" | "TODOS";

type Purchase = {
  id: string;
  usuario: string;
  email: string;
  usernameGta: string;
  plano: Plano;
  valorPago: number;
  status: Status;
  dataCompra: string;
  dataExpiracao?: string | null;
  comprovanteUrl?: string | null;
  token?: string | null;
  tokenUsado: boolean;
};

type Stats = {
  totalVendas: number;
  totalAprovadas: number;
  valorTotalAprovado: number;
  porPlano: {
    VIP_SEMANAL: number;
    VIP_MENSAL: number;
    CARRO_BLINDADO_SEMANAL: number;
    CARRO_BLINDADO_MENSAL: number;
    MOTO_SEMANAL: number;
    MOTO_MENSAL: number;
  };
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status>("TODOS");
  const [planoFilter, setPlanoFilter] = useState<Plano>("TODOS");
  const [periodo, setPeriodo] = useState<"7" | "30" | "365" | "all">("30");
  const [exporting, setExporting] = useState(false);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error("Não foi possível carregar as estatísticas.");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar estatísticas.");
    }
  }

  async function fetchPurchases() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/purchases?status=${statusFilter}&plano=${planoFilter}&periodo=${periodo}`
      );
      if (!res.ok) {
        throw new Error("Não foi possível carregar as compras.");
      }
      const data = await res.json();
      setPurchases(data.purchases);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar compras.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, planoFilter, periodo]);

  const hasData = useMemo(() => purchases.length > 0, [purchases.length]);

  async function handleAction(
    id: string,
    action: "approve" | "reject" | "revoke" | "mark-used"
  ) {
    try {
      const res = await fetch(`/api/admin/purchases/${id}/${action}`, {
        method: "POST"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Ação administrativa falhou.");
      }

      await fetchPurchases();
    } catch (err: any) {
      setError(err.message || "Erro ao executar ação administrativa.");
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/admin/purchases/export?status=${statusFilter}&plano=${planoFilter}&periodo=${periodo}`
      );
      if (!res.ok) {
        throw new Error("Falha ao exportar CSV.");
      }
      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "vendas_zona_leste_vip.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Erro ao exportar CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 mt-6 text-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Painel Admin</h1>
          <p className="text-slate-400 text-xs">
            Gerencie compras de VIP, aprovação de pagamentos e tokens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost text-xs"
            type="button"
            onClick={() => {
              fetchStats();
              fetchPurchases();
            }}
          >
            Recarregar
          </button>
          <button
            className="btn-primary-solid text-xs"
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? "Exportando..." : "Exportar CSV"}
          </button>
          <LogoutButton />
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Total de vendas</p>
          <p className="text-2xl font-semibold">
            {stats ? stats.totalVendas : "-"}
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Vendas aprovadas</p>
          <p className="text-2xl font-semibold">
            {stats ? stats.totalAprovadas : "-"}
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Valor arrecadado</p>
          <p className="text-2xl font-semibold">
            {stats
              ? `R$ ${stats.valorTotalAprovado
                  .toFixed(2)
                  .replace(".", ",")}`
              : "-"}
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 text-xs space-y-1">
          <p className="text-slate-400">Vendas por plano (aprovadas)</p>
          <p>VIP Semanal: {stats ? stats.porPlano.VIP_SEMANAL : "-"}</p>
          <p>VIP Mensal: {stats ? stats.porPlano.VIP_MENSAL : "-"}</p>
          <p>Carro Semanal: {stats ? stats.porPlano.CARRO_BLINDADO_SEMANAL : "-"}</p>
          <p>Carro Mensal: {stats ? stats.porPlano.CARRO_BLINDADO_MENSAL : "-"}</p>
          <p>Moto Semanal: {stats ? stats.porPlano.MOTO_SEMANAL : "-"}</p>
          <p>Moto Mensal: {stats ? stats.porPlano.MOTO_MENSAL : "-"}</p>
        </div>
      </section>

      <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <p className="text-xs text-slate-400">Filtros</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              className="input-field !py-1 !px-2 !text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status)}
            >
              <option value="TODOS">Todos status</option>
              <option value="AGUARDANDO">Aguardando</option>
              <option value="APROVADO">Aprovado</option>
              <option value="RECUSADO">Recusado</option>
              <option value="EXPIRADO">Expirado</option>
            </select>
            <select
              className="input-field !py-1 !px-2 !text-xs"
              value={planoFilter}
              onChange={(e) => setPlanoFilter(e.target.value as Plano)}
            >
              <option value="TODOS">Todos planos</option>
              <option value="VIP_SEMANAL">VIP Semanal</option>
              <option value="VIP_MENSAL">VIP Mensal</option>
              <option value="CARRO_BLINDADO_SEMANAL">Carro Semanal</option>
              <option value="CARRO_BLINDADO_MENSAL">Carro Mensal</option>
              <option value="MOTO_SEMANAL">Moto Semanal</option>
              <option value="MOTO_MENSAL">Moto Mensal</option>
            </select>
            <select
              className="input-field !py-1 !px-2 !text-xs"
              value={periodo}
              onChange={(e) =>
                setPeriodo(e.target.value as "7" | "30" | "365" | "all")
              }
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="365">Últimos 12 meses</option>
              <option value="all">Todo período</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left px-2 py-2">Data</th>
                <th className="text-left px-2 py-2">Usuário</th>
                <th className="text-left px-2 py-2">Plano</th>
                <th className="text-left px-2 py-2">Valor</th>
                <th className="text-left px-2 py-2">Status</th>
                <th className="text-left px-2 py-2">Token</th>
                <th className="text-left px-2 py-2">Comprovante</th>
                <th className="text-left px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-2 py-4 text-center text-slate-500"
                  >
                    Carregando compras...
                  </td>
                </tr>
              )}
              {!loading && !hasData && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-2 py-4 text-center text-slate-500"
                  >
                    Nenhuma compra encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
              {!loading &&
                purchases.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-700/60 align-top"
                  >
                    <td className="px-2 py-2">
                      {new Date(p.dataCompra).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-2">
                      <div>{p.usuario}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.usernameGta}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.email}
                      </div>
                    </td>
                    <td className="px-2 py-2">VIP {p.plano}</td>
                    <td className="px-2 py-2">
                      R$ {p.valorPago.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`badge-status badge-status-${p.status}`}
                      >
                        {p.status}
                      </span>
                      {p.dataExpiracao && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          expira em{" "}
                          {new Date(p.dataExpiracao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {p.token ? (
                        <>
                          <div className="font-mono break-all">
                            {p.token}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            usado: {p.tokenUsado ? "SIM" : "NÃO"}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {p.comprovanteUrl ? (
                        <a
                          href={`/api/admin/purchases/${p.id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-300 hover:text-indigo-200 underline"
                        >
                          Abrir
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-2 py-2 space-y-1">
                      {p.status === "AGUARDANDO" && (
                        <>
                          <button
                            className="btn-primary-solid !px-2 !py-1 w-full"
                            type="button"
                            onClick={() => handleAction(p.id, "approve")}
                          >
                            Aprovar
                          </button>
                          <button
                            className="btn-ghost w-full"
                            type="button"
                            onClick={() => handleAction(p.id, "reject")}
                          >
                            Recusar
                          </button>
                        </>
                      )}
                      {p.status === "APROVADO" && (
                        <>
                          <button
                            className="btn-ghost w-full"
                            type="button"
                            onClick={() => handleAction(p.id, "revoke")}
                          >
                            Revogar VIP
                          </button>
                          {!p.tokenUsado && p.token && (
                            <button
                              className="btn-ghost w-full"
                              type="button"
                              onClick={() => handleAction(p.id, "mark-used")}
                            >
                              Marcar token como usado
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

