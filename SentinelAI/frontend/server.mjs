// testing edit
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = process.env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:8000";

async function startServer() {
  const app = express();

  app.use("/api", async (req, res) => {
    try {
      const path = req.originalUrl.replace(/^\/api/, "");
      const targetUrl = new URL(path.startsWith('/') ? path : '/' + path, BACKEND_URL);
      
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl.href}`);

      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        if (!value || key.toLowerCase() === "host" || key.toLowerCase() === "content-length") {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            headers.append(key, item);
          }
        } else if (typeof value === "string") {
          headers.set(key, value);
        }
      }

      const requestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        requestInit.body = req;
        requestInit.duplex = "half";
      }

      const upstream = await fetch(targetUrl, requestInit);

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "content-encoding") {
          res.setHeader(key, value);
        }
      });

      if (!upstream.body) {
        res.end();
        return;
      }

      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } catch (error) {
      console.error("API proxy error:", error);
      res.status(502).json({
        error: "Backend unavailable",
        detail: error instanceof Error ? error.message : "Unknown proxy error",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SentinelAI frontend server running on http://localhost:${PORT}`);
    console.log(`Proxying /api requests to ${BACKEND_URL}`);
  });
}

startServer();
