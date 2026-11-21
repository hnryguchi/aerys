// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

/**
 * Aplica a migração real em um PostgreSQL embutido (PGlite/WASM), simula os papéis
 * do Supabase e executa supabase/tests/rls.test.sql. Nenhum serviço externo é usado.
 */
describe("permissões do banco (RLS)", () => {
  it("anon/authenticated só leem dados públicos; ninguém altera ou exclui", async () => {
    const db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      grant usage on schema public to anon, authenticated, service_role;
    `);
    const migrations = (await readdir("supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
    await db.exec(await readFile(`supabase/migrations/${migrations[0]}`, "utf8"));
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    for (const f of migrations.slice(1)) await db.exec(await readFile(`supabase/migrations/${f}`, "utf8"));
    const testSql = (await readFile("supabase/tests/rls.test.sql", "utf8")).replace(/^\\set .*$/m, "");
    const results = await db.exec(testSql);
    expect(results.at(-1)?.rows[0]).toEqual({ resultado: "RLS_OK" });
    await db.close();
  }, 60_000);
});
