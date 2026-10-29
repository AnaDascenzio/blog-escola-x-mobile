const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of base64) {
    if (char === "=") break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

function utf8BytesToString(bytes: Uint8Array): string {
  let result = "";
  let i = 0;

  while (i < bytes.length) {
    const byte1 = bytes[i++];

    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if (byte1 >= 0xc0 && byte1 < 0xe0 && i < bytes.length) {
      const byte2 = bytes[i++];
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else if (byte1 >= 0xe0 && byte1 < 0xf0 && i + 1 < bytes.length) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      result += String.fromCharCode(
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f),
      );
    } else {
      i += 1;
    }
  }

  return result;
}

export interface DecodedToken {
  id: string | number;
  email: string;
  role: "TEACHER" | "STUDENT";
}

function isDecodedToken(value: unknown): value is DecodedToken {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (typeof candidate.id === "string" || typeof candidate.id === "number") &&
    typeof candidate.email === "string" &&
    (candidate.role === "TEACHER" || candidate.role === "STUDENT")
  );
}

/**
 * Decodifica o payload de um JWT sem validar a assinatura. Só para uso em UI
 * (ex.: mostrar/esconder telas de professor) — o backend revalida o token e
 * o papel em toda requisição protegida.
 */
export function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const json = utf8BytesToString(base64UrlToBytes(payloadSegment));
    const parsed: unknown = JSON.parse(json);

    return isDecodedToken(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
