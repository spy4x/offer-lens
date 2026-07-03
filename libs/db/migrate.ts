// Database migration runner
// Run: deno run -A libs/db/migrate.ts

import postgres from "postgres"

async function migrate() {
  const sql = postgres({
    host: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    database: Deno.env.get("DB_NAME") || "offerlens",
    user: Deno.env.get("DB_USER") || "offerlens",
    password: Deno.env.get("DB_PASS") || "offerlens",
    max: 2,
  })

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
  } finally {
    await sql.end()
  }
}

if (import.meta.main) {
  await migrate()
}
