// Database migration runner
// Run: deno run -A libs/db/migrate.ts
// Uses singleton sql from mod.ts — DB must be configured via env

import { sql } from "./mod.ts"

async function migrate() {
  if (!sql) {
    console.error(
      "DB not configured. Set DB_HOST (and DB_PORT/DB_NAME/DB_USER/DB_PASS) or DATABASE_URL.",
    )
    Deno.exit(1)
  }

  try {
    // Create migrations table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    // List migration files
    const migrationsDir = new URL("./migrations/", import.meta.url)
    const migrations: string[] = []
    for await (const entry of Deno.readDir(migrationsDir)) {
      if (entry.name.endsWith(".sql")) {
        migrations.push(entry.name)
      }
    }
    migrations.sort()

    // Get already applied migrations
    const applied = await sql<{ name: string }[]>`SELECT name FROM migrations ORDER BY name`
    const appliedNames = new Set(applied.map((r) => r.name))

    // Apply pending migrations
    for (const name of migrations) {
      if (appliedNames.has(name)) {
        console.log(`  ✓ ${name} (already applied)`)
        continue
      }

      const filePath = new URL(`./migrations/${name}`, import.meta.url)
      const sqlContent = await Deno.readTextFile(filePath)

      console.log(`  → Applying ${name}...`)

      await sql.begin(async (tx) => {
        await tx.unsafe(sqlContent)
        await tx`INSERT INTO migrations (name) VALUES (${name})`
      })

      console.log(`  ✓ ${name} applied`)
    }

    console.log("\nMigrations complete.")
  } catch (err) {
    console.error("Migration failed:", err)
    Deno.exit(1)
  }
}

if (import.meta.main) {
  await migrate()
  // Exit explicitly to close DB connections
  Deno.exit(0)
}
