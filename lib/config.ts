const FALLBACK_PIX_KEY = "b6e154aa-4259-4f1f-ba80-63a06af68fcc";

export const PIX_KEY =
  process.env.NEXT_PUBLIC_PIX_CHAVE ||
  process.env.PIX_CHAVE ||
  FALLBACK_PIX_KEY;

