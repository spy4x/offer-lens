// BYOK API routes: manage user's own API keys
import { Hono } from "hono"
import { authenticateRequest } from "../services/auth.ts"
import { getDb } from "@offerlens/db"
import { decrypt, encrypt, maskKey } from "@offerlens/encrypt"
import type { SaveKeyRequest, TestKeyResult, UserApiKey } from "@offerlens/shared"
import { Config } from "@offerlens/backend-services"

export const keysRoute = new Hono()
  // POST /api/keys — save a key
  .post("/", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    let body: SaveKeyRequest
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (!body.provider || typeof body.provider !== "string") {
      return c.json({ error: "provider is required (openai, deepseek, custom, etc.)" }, 400)
    }
    if (!body.apiKey || typeof body.apiKey !== "string" || body.apiKey.length < 8) {
      return c.json({ error: "apiKey is required (min 8 chars)" }, 400)
    }

    try {
      const keyEncrypted = await encrypt(body.apiKey)
      const keyHint = maskKey(body.apiKey, 4)
      const db = getDb()
      await db.saveApiKey(
        auth.user!.sub,
        body.provider,
        keyEncrypted,
        keyHint,
        body.baseUrl || "",
        body.model || "",
      )
      return c.json({ success: true, provider: body.provider, keyHint }, 201)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("Failed to save API key:", msg)
      return c.json({ error: "Failed to save API key" }, 500)
    }
  })
  // GET /api/keys — list saved keys (masked)
  .get("/", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const db = getDb()
    const keys = await db.getApiKeys(auth.user!.sub)

    const result: UserApiKey[] = keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      baseUrl: k.base_url,
      model: k.model,
      keyHint: k.key_hint,
      isActive: k.is_active,
      createdAt: k.created_at.toISOString(),
    }))

    return c.json({ keys: result })
  })
  // DELETE /api/keys/:provider — remove a key
  .delete("/:provider", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const provider = c.req.param("provider")
    if (!provider) {
      return c.json({ error: "provider parameter required" }, 400)
    }

    const db = getDb()
    await db.deleteApiKey(auth.user!.sub, provider)

    return c.json({ success: true })
  })
  // GET /api/keys/test — test the active key with a lightweight LLM call
  .get("/test", async (c) => {
    const auth = await authenticateRequest(c)
    if (auth.error) return c.json(auth.error.body, auth.error.status as 401)

    const provider = c.req.query("provider") || "openai"
    const db = getDb()
    const keyData = await db.getApiKeyEncrypted(auth.user!.sub, provider)

    if (!keyData) {
      return c.json({ success: false, error: `No saved key for provider: ${provider}` }, 404)
    }

    try {
      const apiKey = await decrypt(keyData.key_encrypted)
      const apiBase = keyData.base_url || Config.apiBase
      const model = keyData.model || "gpt-4o-mini"

      const endpoint = `${apiBase}/v1/chat/completions`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "respond with the word 'ok' only" }],
          max_tokens: 10,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return c.json(
          {
            success: false,
            error: `API error ${response.status}: ${text.slice(0, 200)}`,
          } satisfies TestKeyResult,
        )
      }

      return c.json(
        {
          success: true,
          model,
        } satisfies TestKeyResult,
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return c.json({ success: false, error: msg } satisfies TestKeyResult)
    }
  })
