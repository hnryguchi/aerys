#!/usr/bin/env node
// Gera um token aleatório para uma estação e o hash correspondente para o servidor.
// Uso: npm run device:token -- aerys-001
// O token aparece UMA vez no terminal: copie-o para firmware/aerys-estacao/secrets.h.
// Ao servidor vai somente o hash (variável AERYS_DEVICE_TOKENS).
import { createHash, randomBytes } from "node:crypto";

const id = process.argv[2];
if (!id || !/^aerys-\d{3}$/.test(id)) {
  console.error("Informe o identificador da estação no formato aerys-NNN. Ex.: npm run device:token -- aerys-001");
  process.exit(1);
}
const token = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(token, "utf8").digest("hex");

console.log(`
Estação: ${id}

1) Firmware (secrets.h). NÃO compartilhe, NÃO versione:
   #define AERYS_TOKEN "${token}"

2) Servidor (variável de ambiente; acrescente separado por vírgula se já houver outras):
   AERYS_DEVICE_TOKENS=${id}:${hash}

Para revogar: gere um novo token e substitua o hash no servidor.
`);
