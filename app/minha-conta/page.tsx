import { getCurrentUser } from "../../lib/auth";
import { LogoutButton } from "../../components/LogoutButton";
import { getAccountPurchases } from "../../lib/account";

export default async function MinhaContaPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-slate-900/70 border border-slate-700 rounded-2xl p-6 text-sm">
        <p>Você precisa estar autenticado para acessar esta página.</p>
      </div>
    );
  }

  const { purchases, active } = await getAccountPurchases(user.id);

  return (
    <div className="space-y-6 mt-6">
      <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">Minha conta</h1>
          <p className="text-sm text-slate-400">
            Olá, <span className="font-semibold">{user.nome}</span> (
            {user.usernameGta})
          </p>
        </div>
        <LogoutButton />
      </section>

      <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-3">Plano atual</h2>
        {active ? (
          <div className="text-sm space-y-1">
            <p>
              Plano:{" "}
              <span className="font-semibold">
                VIP {active.plano.charAt(0) + active.plano.slice(1).toLowerCase()}
              </span>
            </p>
            <p>
              Status:{" "}
              <span className={`badge-status badge-status-${active.status}`}>
                {active.status}
              </span>
            </p>
            {active.dataExpiracao && (
              <p>
                Expira em:{" "}
                {new Date(active.dataExpiracao).toLocaleDateString("pt-BR")}
              </p>
            )}
            {active.token && (
              <p>
                Token:{" "}
                <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded-md border border-slate-600">
                  {active.token}
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Você não possui nenhum VIP ativo ou em análise no momento.
          </p>
        )}
      </section>

      <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-3">Histórico de compras</h2>
        {purchases.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhuma compra registrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left px-2 py-2">Data</th>
                  <th className="text-left px-2 py-2">Plano</th>
                  <th className="text-left px-2 py-2">Valor</th>
                  <th className="text-left px-2 py-2">Status</th>
                  <th className="text-left px-2 py-2">Token</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-t border-slate-700/60">
                    <td className="px-2 py-2">
                      {new Date(p.dataCompra).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-2">VIP {p.plano}</td>
                    <td className="px-2 py-2">
                      R$ {p.valorPago.toNumber().toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`badge-status badge-status-${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono">
                      {p.token ? p.token : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

