import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

function getTransport() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "Configuração SMTP incompleta. Verifique variáveis de ambiente."
    );
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transport;
}

export async function sendVipApprovedEmail(params: {
  to: string;
  nome: string;
  plano: string;
  token: string;
}) {
  const transport = getTransport();

  const html = `
    <div style="max-width:600px;margin:0 auto;background-color:#1f2937;color:#f3f4f6;padding:24px;border-radius:8px;font-family:sans-serif;">
      <h1 style="color:#a855f7;">VIP Aprovado - Zona Leste RP</h1>
      <p>Olá, <strong>${params.nome}</strong>.</p>
      <p>Seu VIP <strong>${params.plano}</strong> foi aprovado com sucesso.</p>
      <p>Este é o seu <strong>token VIP</strong> único (20 caracteres alfanuméricos):</p>
      <pre style="background:#020420;padding:12px;border-radius:8px;border:1px dashed #4f46e5;font-size:14px;">${params.token}</pre>
      <p><strong>Instruções de ativação:</strong></p>
      <ol>
        <li>Acesse o servidor Zona Leste RP.</li>
        <li>Abra o menu de ativação de VIP.</li>
        <li>Cole o token exatamente como recebido.</li>
        <li>Confirme a ativação e aguarde a validação.</li>
      </ol>
      <p>Guarde este token com segurança. Após marcado como usado pela staff, ele não poderá ser reutilizado.</p>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;">Este e-mail foi enviado automaticamente pela loja VIP da Zona Leste RP.</p>
    </div>
  `;

  await transport.sendMail({
    from: SMTP_FROM,
    to: params.to,
    subject: "Seu VIP foi aprovado - Zona Leste RP",
    html
  });
}
