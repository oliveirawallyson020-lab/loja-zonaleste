# Loja VIP - Zona Leste RP

Loja virtual para venda de VIP do servidor **Zona Leste RP**, preparada para produção com:

- **Next.js (App Router) + TypeScript**
- **Prisma ORM** com **Postgres (Neon)** como banco de dados
- Autenticação com **JWT em cookie HTTP-only**
- Upload de comprovante via **Vercel Blob**
- Envio automático de e-mail na aprovação do VIP
- Painel administrativo completo para aprovação, revogação e exportação CSV

## Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma ORM
- Postgres (Neon Database)
- bcryptjs
- jose (JWT)
- Nodemailer (SMTP)
- Vercel Blob (upload de comprovante)

## Estrutura de pastas

- `app/` – Páginas (App Router) e rotas de API
  - `/` – Landing page gamer com planos VIP
  - `/login` – Login
  - `/cadastro` – Cadastro
  - `/checkout` – Fluxo de compra + upload do comprovante
  - `/minha-conta` – Minha conta / histórico
  - `/admin` – Painel Admin
  - `api/` – Rotas serverless:
    - `api/auth/register` – Cadastro
    - `api/auth/login` – Login
    - `api/auth/logout` – Logout
    - `api/purchase` – Registro de compra com upload
    - `api/admin/stats` – Dashboard
    - `api/admin/purchases` – Lista + filtros
    - `api/admin/purchases/[id]/approve` – Aprovar + gerar token + e-mail
    - `api/admin/purchases/[id]/reject` – Recusar
    - `api/admin/purchases/[id]/revoke` – Revogar VIP
    - `api/admin/purchases/[id]/mark-used` – Marcar token como usado
    - `api/admin/purchases/export` – Exportação CSV
- `components/` – Componentes reutilizáveis (pode ser expandido depois)
- `lib/` – Código de domínio e infra
  - `prisma.ts` – Singleton do Prisma
  - `auth.ts` – Hash de senha, JWT, helpers de usuário atual
  - `token.ts` – Geração de token VIP único (20 caracteres alfanuméricos)
  - `vip.ts` – Cálculo de preço/ período, expiração automática
  - `email.ts` – Envio de e-mail com token
- `prisma/`
  - `schema.prisma` – Schema completo (User, Purchase, AdminLog)
  - `schema.sql` – Script SQL alternativo
  - `seed.ts` – Seed de admin inicial
- `styles/` – Estilos globais
- `middleware.ts` – Proteção de `/minha-conta` e `/admin`

## Banco de dados (Neon)

1. Crie um projeto Postgres no **Neon**.
2. Copie a connection string (Postgres) e coloque em `DATABASE_URL` no `.env`.
3. Ajuste SSL (`?sslmode=require`) se necessário (Neon normalmente já fornece).

Exemplo em `.env.example`:

```bash
DATABASE_URL="postgresql://usuario:senha@host-neon:5432/zona_leste_rp?sslmode=require"
```

### Rodar migrações Prisma

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### Seed de admin

Configure envs opcionais em `.env`:

```bash
INIT_ADMIN_EMAIL="admin@zonalesterp.com"
INIT_ADMIN_PASSWORD="senha-forte"
```

Depois:

```bash
npx prisma db seed
```

## Execução local

1. Crie um arquivo `.env` na raiz baseado em `.env.example`.
2. Instale dependências:

```bash
npm install
```

3. Gere o client Prisma e rode migrações:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Rode o projeto:

```bash
npm run dev
```

App ficará disponível em `http://localhost:3000`.

## Upload de comprovante (Vercel Blob)

Este projeto usa o **Vercel Blob** para armazenar os comprovantes do PIX de forma compatível com ambiente serverless da Vercel.

1. Crie um token de acesso no painel da Vercel (Blob).
2. Configure a variável:

```bash
BLOB_READ_WRITE_TOKEN="seu_token_blob"
```

3. Não é necessário configurar bucket manualmente; o código usa `put()` com acessos públicos.

## Envio de e-mail

O envio de e-mail é feito via **SMTP** com o Nodemailer.

Defina as variáveis em `.env`:

```bash
SMTP_HOST="smtp.seuprovedor.com"
SMTP_PORT="587"
SMTP_USER="usuario"
SMTP_PASS="senha"
SMTP_FROM='"Zona Leste RP" <no-reply@zonalesterp.com>'
```

Recomenda-se usar um provedor transacional (Elastic Email, SendGrid, Mailersend, etc.) em produção.

## Autenticação

- Cadastro (`/cadastro`) com:
  - Nome
  - E-mail (único)
  - Username GTA RP
  - Senha + confirmação
- Senha é armazenada com **bcrypt** (`senhaHash`).
- Login (`/login`) gera um **JWT** assinado com `AUTH_SECRET` e salva em cookie HTTP-only (`auth_token`).
- `middleware.ts` protege:
  - `/minha-conta` (qualquer usuário logado)
  - `/admin` (apenas `role = ADMIN`)

## Fluxo de compra VIP (PIX)

1. Usuário escolhe plano na home.
2. É redirecionado para `/checkout?plano=MENSAL|SEMESTRAL|ANUAL`.
3. Página mostra:
   - Valor
   - Chave PIX: `b6e154aa-4259-4f1f-ba80-63a06af68fcc`
   - Instruções de pagamento
   - Campo para upload do comprovante
4. Ao enviar, chama `POST /api/purchase` com:
   - Plano
   - Comprovante (file)
5. Backend:
   - Garante que usuário está autenticado
   - Faz upload do comprovante no Vercel Blob
   - Cria `Purchase` com:
     - `status = AGUARDANDO`
     - `valorPago` calculado pelo servidor (evita fraude)
6. Admin analisa na tela `/admin`:
   - Filtra por status / plano / período
   - Abre comprovante (URL pública)
   - Pode **aprovar** ou **recusar**:
     - Aprovar:
       - Gera token único de 20 caracteres alfanuméricos
       - Calcula início/fim do plano
       - Atualiza status para `APROVADO`
       - Envia e-mail com nome, plano, token e instruções
     - Recusar:
       - Atualiza status para `RECUSADO`
7. Sistema marca VIP como expirado automaticamente ao:
   - Acessar `/minha-conta` ou rotas admin – função `expireOldPurchases()` atualiza `APROVADO` com `dataExpiracao < agora` para `EXPIRADO`.
8. Admin pode:
   - **Revogar VIP** (força `EXPIRADO` e atualiza `dataExpiracao`)
   - **Marcar token como usado** (`token_usado = true`)
   - **Exportar CSV** das vendas.

## Deploy na Vercel

1. Suba o código para o GitHub em `https://github.com/SeuUsuario/zona_leste_rp.git`.
2. No painel da Vercel:
   - Importar o repositório.
   - Definir as variáveis de ambiente:
     - `DATABASE_URL`
     - `AUTH_SECRET`
     - `SMTP_*`
     - `BLOB_READ_WRITE_TOKEN`
     - (Opcional) `INIT_ADMIN_EMAIL`, `INIT_ADMIN_PASSWORD`
3. Rodar (ou configurar) migrações Prisma no deploy (`npx prisma migrate deploy`).
4. A Vercel detecta automaticamente o projeto Next.js e faz o build.

## Boas práticas e considerações

- Nenhum dado sensível é comitado: use `.env` apenas localmente, baseando-se em `.env.example`.
- Autenticação baseada em JWT com:
  - Cookie HTTP-only
  - `sameSite=lax`
  - `secure` em produção
- Upload de comprovante em storage compatível com serverless (Vercel Blob).
- Geração de token VIP:
  - 20 caracteres alfanuméricos
  - Garantia de unicidade via checagem no banco
- Camadas de domínio centralizadas em `lib/` para facilitar manutenção futura.

