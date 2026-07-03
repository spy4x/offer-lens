// Fresh dev server entry point
import dev from "$fresh/dev.ts"
import config from "./fresh.config.ts"

await dev(import.meta.url, config)
