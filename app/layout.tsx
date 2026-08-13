import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Zona Leste RP - Loja VIP",
  description: "Loja virtual de VIP para o servidor Zona Leste RP."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-[#050816] via-[#050016] to-black text-gray-100">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-purple-900/50 bg-black/40 backdrop-blur sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-cyan-400 shadow-[0_0_20px_rgba(168,85,247,0.8)]" />
                <span className="font-semibold tracking-wide text-sm sm:text-base">
                  Zona Leste RP • VIP
                </span>
              </div>
              <nav className="flex gap-4 text-xs sm:text-sm">
                <a href="/" className="hover:text-purple-300 transition-colors">
                  Início
                </a>
                <a
                  href="/minha-conta"
                  className="hover:text-purple-300 transition-colors"
                >
                  Minha Conta
                </a>
                <a
                  href="/admin"
                  className="hover:text-purple-300 transition-colors"
                >
                  Admin
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
          </main>
          <footer className="border-t border-purple-900/50 bg-black/60 text-xs text-gray-500">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <span>Zona Leste RP • Loja VIP</span>
              <span>Ambiente de produção pronto para Vercel</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

