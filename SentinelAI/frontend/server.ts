import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "sentinel-ai-secret-key-2026";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Database setup
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      key TEXT,
      name TEXT DEFAULT 'Default Key',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  console.log("✅ SentinelAI Database Initialized");

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword]);
      const token = jwt.sign({ userId: result.lastID, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: result.lastID, email } });
    } catch (error: any) {
      console.error("Registration Error:", error);
      const message = error.code === 'SQLITE_CONSTRAINT' ? "Email already registered" : "Internal server error";
      res.status(400).json({ error: message, detail: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // API Key Routes
  app.post("/api/keys/generate", async (req, res) => {
    const authHeader = req.headers.authorization;
    const { password, name } = req.body;

    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await db.get("SELECT * FROM users WHERE id = ?", [decoded.userId]);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const apiKey = `sk_sentinel_${crypto.randomBytes(24).toString("hex")}`;
      await db.run("INSERT INTO api_keys (user_id, key, name) VALUES (?, ?, ?)", [user.id, apiKey, name || 'Default Key']);
      
      res.json({ apiKey });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  app.get("/api/keys", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const keys = await db.all(
        "SELECT id, name, key, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC", 
        [decoded.userId]
      );
      res.json(keys);
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Forensic Placeholder Endpoints (to be replaced by FastAPI/n8n integration)
  app.post("/api/verify_news", async (req, res) => {
    // Placeholder logic for semantic news verification
    res.json({
      verdict: "Real",
      confidence: 94.2,
      reasoning: "The headline aligns with verified official sources and shows no linguistic markers of synthetic generation.",
      evidence: ["Verified by Reuters Fact Check", "Source matches DOJ official statement"]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting Vite in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ SentinelAI Unified Server running on http://localhost:${PORT}`);
  });
}

startServer();
