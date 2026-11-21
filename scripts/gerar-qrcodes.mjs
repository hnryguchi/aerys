#!/usr/bin/env node
// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
// Gera QR Codes (SVG e PNG) das estações apontando para a URL pública DEFINITIVA.
// Uso: npm run qr -- --site https://seu-dominio.com.br [--estacoes aerys-001,aerys-002]
// Recusa HTTP, localhost, IPs privados e túneis temporários.
// O QR contém apenas a URL pública da estação, nunca tokens, senhas ou dados de Wi-Fi.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const site = arg("site") ?? process.env.NEXT_PUBLIC_SITE_URL;
const estacoes = (arg("estacoes") ?? "aerys-001").split(",").map((s) => s.trim());

const TEMP = [/(^|\.)localhost$/i, /\.local$/i, /\.invalid$/i, /\.example$/i, /\.test$/i, /ngrok/i, /trycloudflare\.com$/i, /loca\.lt$/i, /localtunnel/i, /serveo\.net$/i];
function recusar(motivo) {
  console.error(`URL recusada: ${motivo}`);
  process.exit(1);
}
if (!site) recusar("informe --site https://... ou NEXT_PUBLIC_SITE_URL");
let u;
try {
  u = new URL(site);
} catch {
  recusar("URL inválida");
}
if (u.protocol !== "https:") recusar("use HTTPS");
if (u.username || u.password || u.search || u.hash) recusar("a URL base não pode ter credenciais nem parâmetros");
if (/^(10\.|127\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname) || u.hostname.startsWith("[")) recusar("endereço local/privado");
if (TEMP.some((p) => p.test(u.hostname))) recusar("endereço temporário ou de teste");

const outDir = path.resolve("saida", "qrcodes");
await mkdir(outDir, { recursive: true });
for (const id of estacoes) {
  if (!/^aerys-\d{3}$/.test(id)) recusar(`identificador inválido: ${id}`);
  const url = `${u.origin}/estacao/${id}`;
  const opts = { errorCorrectionLevel: "M", margin: 2, color: { dark: "#0c1a22", light: "#ffffff" } };
  await writeFile(path.join(outDir, `${id}.svg`), await QRCode.toString(url, { ...opts, type: "svg" }));
  await QRCode.toFile(path.join(outDir, `${id}.png`), url, { ...opts, width: 1024 });
  console.log(`${id} -> ${url}`);
}
console.log(`Arquivos em ${outDir}`);
