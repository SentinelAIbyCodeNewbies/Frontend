// testing edit
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = (process.env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/+$/, '');

async function startServer() {
  const app = express();

  app.use("/api", async (req, res) => {
    try {
      let subPath = req.originalUrl.replace(/^\/api/, "");
      if (!subPath.startsWith('/')) subPath = '/' + subPath;
      
      const targetUrl = new URL(BACKEND_URL + subPath);
      
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl.href}`);

      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        if (!value || lowerKey === "host" || lowerKey === "content-length" || lowerKey === "connection" || lowerKey === "accept-encoding") {
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

      headers.set("ngrok-skip-browser-warning", "true");
      headers.set("Accept", "application/json");
      headers.set("Host", targetUrl.host);

      const requestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        requestInit.body = req;
        requestInit.duplex = "half";
      }

      const upstream = await fetch(targetUrl, requestInit);

      console.log(`[Proxy] Status: ${upstream.status} ${upstream.statusText}`);
      console.log(`[Proxy] Content-Type: ${upstream.headers.get("content-type")}`);

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== "content-encoding" && lowerKey !== "transfer-encoding" && lowerKey !== "content-length") {
          res.setHeader(key, value);
        }
      });

      const body = await upstream.arrayBuffer();
      
      // If we got a 404, log the body to see what it says
      if (upstream.status === 404) {
        console.log(`[Proxy] 404 Body: ${Buffer.from(body).toString().slice(0, 200)}`);
      }

      res.send(Buffer.from(body));
      
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
    console.log(`\n--- SentinelAI Server Debug ---`);
    console.log(`Port: ${PORT}`);
    console.log(`Backend Target: ${BACKEND_URL}`);
    console.log(`--------------------------------\n`);
  });
}

startServer();
