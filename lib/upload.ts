import { randomBytes } from "crypto";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

export type ValidatedComprovante = {
  buffer: Buffer;
  mime: AllowedMime;
  blobPath: string;
};

function detectMimeFromBuffer(buffer: Buffer): AllowedMime | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // WEBP: "RIFF"...."WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function getExtensionFromMime(mime: AllowedMime): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function validateAndPrepareComprovante(
  file: File,
  userId: string
): Promise<ValidatedComprovante> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Comprovante ultrapassa o limite máximo de 5MB.");
  }

  const declaredType = file.type as AllowedMime | string;

  if (!ALLOWED_MIME.includes(declaredType as AllowedMime)) {
    throw new Error(
      "Formato de comprovante inválido. Use PNG, JPEG ou WEBP."
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectMimeFromBuffer(buffer);

  if (!detected || detected !== declaredType) {
    throw new Error(
      "O tipo de arquivo do comprovante não é permitido ou não confere com o conteúdo."
    );
  }

  const randomName = randomBytes(16).toString("hex");
  const extension = getExtensionFromMime(detected);

  const blobPath = `comprovantes/${userId}/${randomName}.${extension}`;

  return {
    buffer,
    mime: detected,
    blobPath
  };
}

