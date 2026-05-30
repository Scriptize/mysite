const http = require("http");
const fs = require("fs");
const path = require("path");
const { buildContent, COLLECTIONS } = require("../scripts/build-content.js");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 5173);
const publicOnly = process.argv.includes("--public-only");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body, null, 2), "application/json; charset=utf-8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 10 * 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function slugify(value) {
  return String(value || "untitled")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";
}

function safeCollection(collection) {
  if (!COLLECTIONS.includes(collection)) throw new Error(`invalid collection: ${collection}`);
  return collection;
}

function itemPath(collection, slug) {
  collection = safeCollection(collection);
  slug = slugify(slug);
  return path.join(ROOT, "content", collection, `${slug}.json`);
}

function listContent() {
  buildContent();
  const generated = requireFresh(path.join(ROOT, "assets", "generated-content.js"));
  return generated;
}

function requireFresh(file) {
  const raw = fs.readFileSync(file, "utf8");
  const marker = "window.SITE_CONTENT = ";
  const start = raw.indexOf(marker);
  if (start === -1) return { collections: {}, all: [] };
  const json = raw.slice(start + marker.length).replace(/;\s*$/, "");
  return JSON.parse(json);
}

async function api(req, res, url) {
  if (publicOnly) return sendJson(res, 403, { error: "studio api disabled in public-only mode" });

  try {
    if (req.method === "GET" && url.pathname === "/api/content") {
      return sendJson(res, 200, listContent());
    }

    if (req.method === "GET" && url.pathname === "/api/post") {
      const collection = safeCollection(url.searchParams.get("collection"));
      const slug = slugify(url.searchParams.get("slug"));
      const file = itemPath(collection, slug);
      if (!fs.existsSync(file)) return sendJson(res, 404, { error: "not found" });
      return sendJson(res, 200, JSON.parse(fs.readFileSync(file, "utf8")));
    }

    if (req.method === "POST" && url.pathname === "/api/post") {
      const raw = await readBody(req);
      const item = JSON.parse(raw);
      const collection = safeCollection(item.collection);
      const slug = slugify(item.slug || item.title);
      const clean = {
        title: item.title || "Untitled",
        slug,
        collection,
        type: item.type || collection.slice(0, -1),
        date: item.date || new Date().toISOString().slice(0, 10),
        status: item.status || "draft",
        summary: item.summary || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        icon: item.icon || "/images/post-icons/default.svg",
        heroImage: item.heroImage || "",
        featured: Boolean(item.featured),
        badge: item.badge || "",
        sections: Array.isArray(item.sections) ? item.sections : []
      };

      const file = itemPath(collection, slug);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(clean, null, 2) + "\n", "utf8");
      const payload = buildContent();
      return sendJson(res, 200, { ok: true, file: path.relative(ROOT, file), item: clean, count: payload.all.length });
    }

    if (req.method === "POST" && url.pathname === "/api/delete") {
      const raw = await readBody(req);
      const { collection, slug } = JSON.parse(raw);
      const file = itemPath(collection, slug);
      if (fs.existsSync(file)) fs.unlinkSync(file);
      buildContent();
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/rebuild") {
      const payload = buildContent();
      return sendJson(res, 200, { ok: true, count: payload.all.length });
    }

    return sendJson(res, 404, { error: "api route not found" });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function serveFile(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/studio" || pathname === "/studio/") {
    pathname = "/studio/index.html";
  }

  let filePath = path.join(ROOT, pathname);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(ROOT)) return send(res, 403, "forbidden");

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    fs.createReadStream(resolved).pipe(res);
    return;
  }

  // SPA fallback for clean local routes like /projects/orderbook-exchange-simulator.
  const index = path.join(ROOT, "index.html");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  fs.createReadStream(index).pipe(res);
}

buildContent();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) return api(req, res, url);
  return serveFile(req, res, url);
});

server.listen(PORT, () => {
  console.log(`local site running at http://localhost:${PORT}`);
  if (!publicOnly) console.log(`studio running at http://localhost:${PORT}/studio`);
});
