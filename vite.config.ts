import path from "path";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { SYSTEM_PROMPT } from "./api/_prompt";

const MODEL = "llama-3.1-8b-instant";

function devApiPlugin(token: string): Plugin {
  return {
    name: "dev-api-generate",
    configureServer(server) {
      server.middlewares.use("/api/generate", (req, res, next) => {
        if (req.method !== "POST") { next(); return; }

        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", async () => {
          if (!token) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Service not configured — set VITE_GROQ_TOKEN in .env" }));
            return;
          }
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString()) as { prompt?: string };
            const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 1000) : "";
            if (!prompt) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Missing prompt" }));
              return;
            }
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                model: MODEL,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: prompt },
                ],
                max_tokens: 800,
                temperature: 0.3,
              }),
            });
            const data = await groqRes.json();
            res.writeHead(groqRes.status, { "Content-Type": "application/json" });
            res.end(JSON.stringify(data));
          } catch {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal dev-server error" }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv with empty prefix reads ALL vars in .env (not just VITE_ ones)
  const env = loadEnv(mode, process.cwd(), "");
  const token = env.VITE_GROQ_TOKEN ?? env.GROQ_TOKEN ?? "";

  return {
    plugins: [react(), devApiPlugin(token)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      environment: "node",
    },
  };
});
