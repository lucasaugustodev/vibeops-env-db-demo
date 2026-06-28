import Database from "better-sqlite3";
import http from "node:http";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const port = Number(process.env.PORT || 3000);
const appEnv = process.env.APP_ENV || "local";
const branchName = process.env.BRANCH_NAME || "unknown";
const dbFile = process.env.DB_FILE || "./data/app.sqlite";
const appName = process.env.APP_NAME || "VibeOps Env DB Demo";

mkdirSync(dirname(dbFile), { recursive: true });
const db = new Database(dbFile);
db.exec(`
  create table if not exists visits (
    id integer primary key autoincrement,
    environment text not null,
    branch text not null,
    created_at text not null default current_timestamp
  );
`);

const insertVisit = db.prepare("insert into visits (environment, branch) values (?, ?)");
const stats = db.prepare(`
  select count(*) as total,
         min(created_at) as first_visit,
         max(created_at) as last_visit
  from visits
`);
const recent = db.prepare("select id, environment, branch, created_at from visits order by id desc limit 6");

const styles = readFileSync(join(process.cwd(), "styles.css"), "utf8");

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, appEnv, branchName }));
    return;
  }

  insertVisit.run(appEnv, branchName);
  const currentStats = stats.get();
  const rows = recent.all();

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(appName)}</title>
    <style>${styles}</style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">VibeOps full flow demo</p>
        <h1>${escapeHtml(appName)}</h1>
        <p class="lead">App com branch dev/prod, env injetado pelo VibeOps e uma DB SQLite simples dentro do workspace.</p>
      </section>
      <section class="grid">
        <article><span>Ambiente</span><strong>${escapeHtml(appEnv)}</strong></article>
        <article><span>Branch</span><strong>${escapeHtml(branchName)}</strong></article>
        <article><span>DB file</span><strong>${escapeHtml(dbFile)}</strong></article>
        <article><span>Visitas</span><strong>${currentStats.total}</strong></article>
      </section>
      <section class="panel">
        <h2>Ultimos registros gravados na DB</h2>
        <div class="table">
          ${rows.map((row) => `<div><span>#${row.id}</span><span>${escapeHtml(row.environment)}</span><span>${escapeHtml(row.branch)}</span><span>${escapeHtml(row.created_at)}</span></div>`).join("")}
        </div>
      </section>
    </main>
  </body>
</html>`);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`${appName} running on :${port}`);
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
