// Backend configuration from environment
export class Config {
  static get port(): number {
    return parseInt(Deno.env.get("PORT") || "8000")
  }

  static get demoApiKey(): string {
    return Deno.env.get("DEMO_OPENAI_API_KEY") || ""
  }

  static get apiBase(): string {
    return Deno.env.get("OPENAI_API_BASE") || "https://api.deepseek.com"
  }

  static get model(): string {
    return Deno.env.get("LLM_MODEL") || "deepseek-chat"
  }

  static get batchConcurrency(): number {
    return parseInt(Deno.env.get("BATCH_CONCURRENCY") || "5")
  }
}
