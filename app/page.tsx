import Link from "next/link";
import "./home.css";
import { PIX_KEY } from "../lib/config";

const VIP_PLANS = [
  {
    id: "VIP_SEMANAL",
    name: "VIP Semanal",
    description: "Ideal para testar os benefícios de ser VIP na cidade.",
    original: 15,
    price: 15,
    discount: 0,
    highlight: false,
    features: ["Acesso completo", "Ativação em 24h", "Salário bônus"]
  },
  {
    id: "VIP_MENSAL",
    name: "VIP Mensal",
    description: "O clássico. Melhor custo-benefício para jogadores assíduos.",
    original: 35,
    price: 35,
    discount: 0,
    highlight: true,
    features: ["Tudo do VIP Semanal", "Prioridade na fila", "Mansão liberada"]
  }
];

const CAR_PLANS = [
  {
    id: "CARRO_BLINDADO_SEMANAL",
    name: "Carro Blindado (7 Dias)",
    description: "Aluguel semanal de veículo blindado para segurança extrema.",
    original: 20,
    price: 20,
    discount: 0,
    highlight: false,
    features: ["Blindagem nível 5", "Motor tunado", "Não perde no restart"]
  },
  {
    id: "CARRO_BLINDADO_MENSAL",
    name: "Carro Blindado (30 Dias)",
    description: "Acesso mensal ao blindado com desconto especial.",
    original: 60,
    price: 50,
    discount: 16,
    highlight: true,
    features: ["Tudo do semanal", "Pintura customizada gratuita", "Reparo VIP"]
  }
];

const MOTO_PLANS = [
  {
    id: "MOTO_SEMANAL",
    name: "Moto VIP (7 Dias)",
    description: "Agilidade máxima nas ruas da Zona Leste.",
    original: 15,
    price: 15,
    discount: 0,
    highlight: false,
    features: ["Velocidade máxima", "Manobras exclusivas", "Spawn rápido"]
  },
  {
    id: "MOTO_MENSAL",
    name: "Moto VIP (30 Dias)",
    description: "Para quem quer dominar as ruas o mês inteiro.",
    original: 45,
    price: 35,
    discount: 22,
    highlight: true,
    features: ["Tudo do semanal", "Capacete exclusivo", "Zero taxa de seguro"]
  }
];

function PlanGrid({ plans, title }: { plans: any[]; title: string }) {
  return (
    <div className="mb-16">
      <h3 className="text-2xl font-bold mb-6 text-purple-400">{title}</h3>
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.highlight ? "plan-card-highlight" : ""}`}
          >
            {plan.highlight && (
              <div className="plan-tag">Mais Vantajoso</div>
            )}
            <h3>{plan.name}</h3>
            <p className="plan-description">{plan.description}</p>

            <div className="plan-price-group">
              {plan.discount > 0 && (
                <p className="plan-original">
                  R$ {plan.original.toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className="plan-price">
                R$ {plan.price.toFixed(2).replace(".", ",")}
                {plan.discount > 0 && (
                  <span className="plan-discount">
                    -{plan.discount}% OFF
                  </span>
                )}
              </p>
            </div>

            <ul className="plan-features">
              {plan.features.map((f: string, i: number) => (
                <li key={i}>{f}</li>
              ))}
            </ul>

            <Link
              href={`/checkout?plano=${plan.id}`}
              className="plan-button"
            >
              Comprar Agora
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-root">
      <section className="hero">
        <div className="hero-bg-orbit" />
        <div className="hero-bg-grid" />

        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-kicker">Loja oficial de VIP e Veículos</p>
            <h1>
              Eleve seu jogo
              <span className="hero-neon"> na Zona Leste RP</span>
            </h1>
            <p className="hero-subtitle">
              Garanta seu VIP, Carro Blindado ou Moto com pagamento rápido via PIX.
              Domine as ruas com estilo e vantagens exclusivas!
            </p>
            <div className="hero-actions">
              <Link href="#planos" className="btn-primary">
                Ver Produtos
              </Link>
              <Link href="/minha-conta" className="btn-secondary">
                Acessar minha conta
              </Link>
            </div>
            <p className="hero-badges">
              <span className="badge">PIX automático</span>
              <span className="badge">Entrega Rápida</span>
              <span className="badge">100% Seguro</span>
            </p>
          </div>
          <div className="hero-card">
            <div className="hero-card-inner">
              <p className="hero-card-title">PIX da Zona Leste RP</p>
              <p className="hero-card-key">{PIX_KEY}</p>
              <p className="hero-card-tip">
                Após o pagamento, basta enviar o comprovante pelo fluxo da
                compra. A staff valida manualmente e você recebe seu item/benefício no jogo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="plans-section">
        <h2 className="section-title">Nossos Produtos</h2>
        <p className="section-subtitle">
          Escolha o pacote ideal para o seu estilo de jogo.
        </p>

        <PlanGrid title="⭐ Planos VIP" plans={VIP_PLANS} />
        <PlanGrid title="🛡️ Carros Blindados" plans={CAR_PLANS} />
        <PlanGrid title="🏍️ Motos Exclusivas" plans={MOTO_PLANS} />
      </section>
    </div>
  );
}
