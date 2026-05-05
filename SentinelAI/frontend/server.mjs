import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const PORT = Number(process.env.PORT || 3000);

// Pull the AWS IP from the .env file safely
const BACKEND_URL = (process.env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:8080").replace(/\/+$/, '');

async function startServer() {
  const app = express();

  app.use("/api", async (req, res) => {
    try {
      let subPath = req.originalUrl.replace(/^\/api/, "");
      if (!subPath.startsWith('/')) subPath = '/' + subPath;
      
      // Construct the URL safely using concatenation to avoid trailing slash issues
      const targetUrl = new URL(BACKEND_URL + subPath);
      
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl.href}`);

      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        
        // Strip headers that cause CORS/Host mismatches, BUT keep "content-length"
        if (!value || lowerKey === "host" || lowerKey === "connection" || lowerKey === "accept-encoding" || lowerKey === "origin" || lowerKey === "referer") {
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

      const requestInit = {
        method: req.method,
        headers,
      };

      // BUFFER THE BODY instead of streaming it. 
      // This prevents the chunked encoding 500 error in FastAPI.
      if (req.method !== "GET" && req.method !== "HEAD") {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        requestInit.body = Buffer.concat(chunks);
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
      
      if (upstream.status >= 400) {
        console.log(`[Proxy] Error Body: ${Buffer.from(body).toString().slice(0, 200)}`);
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