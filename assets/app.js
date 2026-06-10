const SITE = {
  name: "Scriptize",
  line: "systems / rust / bots / thoughts / etc.",
  profileImage: "/images/sitepfp.jpg",
  bio: "I like building things that make my cortisol high but my dopamine higher. bots, systems, weird interfaces, and projects that force me to learn what is actually happening underneath. I’m drawn to Rust, lower-level programming, learning about markets, and seeing people use stuff I worked on.",
  links: [
    ["github", "https://github.com/Scriptize"],
    ["email", "mailto:djb659@nyu.edu"],
    ["resume", "/resume.pdf"]
  ]
};

const COLLECTIONS = {
  posts: { label: "posts", singular: "post" },
  projects: { label: "projects", singular: "project" },
  retrospectives: { label: "retrospectives", singular: "retrospective" },
  features: { label: "features", singular: "feature" },
  thoughts: { label: "thoughts", singular: "thought" },
  work: { label: "work", singular: "work" }
};

const nav = ["posts", "projects", "retrospectives", "features", "thoughts", "work"];
const content = window.SITE_CONTENT || { collections: {}, all: [] };

const BADGES = {
  new: "NEW ✨",
  wip: "WIP ⚙️",
  draft: "DRAFT 💭",
};

function renderBadge(badge) {
  if (!badge || !BADGES[badge]) return "";
  return `<span class="post-badge">${BADGES[badge]}</span>`;
}

function sectionAnchor(section, index) {
  const raw = section.heading || `section-${index + 1}`;

  return String(raw)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderPostToc(item) {
  const sections = (item.sections || []).filter(section => section.heading);

  if (!sections.length) return "";

  return `
    <aside class="post-toc" aria-label="post sections">
      <div class="post-toc-label">sections</div>
      ${sections.map((section, index) => `
        <a href="#${sectionAnchor(section, index)}">
          ${escapeHtml(section.heading)}
        </a>
      `).join("")}
    </aside>
  `;
}



const $ = (sel, root = document) => root.querySelector(sel);
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");


function isSafeHref(href = "") {
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/.test(href);
}

function inlineText(text = "") {
  const input = String(text);

  const pattern = /(`[^`]+`)|\[([^\]]+)\]\(([^)\s]+)\)/g;

  let output = "";
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(input)) !== null) {
    output += escapeHtml(input.slice(lastIndex, match.index));

    const raw = match[0];

    if (raw.startsWith("`")) {
      const code = raw.slice(1, -1);
      output += `<code class="inline-code">${escapeHtml(code)}</code>`;
    } else {
      const label = match[2];
      const href = match[3];

      if (isSafeHref(href)) {
        const external = /^https?:\/\//.test(href);
        output += `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(label)}</a>`;
      } else {
        output += escapeHtml(raw);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  output += escapeHtml(input.slice(lastIndex));
  return output;
}
function getPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function routeToParts(path = getPath()) {
  const parts = path.split("/").filter(Boolean);
  return { collection: parts[0] || "home", slug: parts[1] || null };
}

function postUrl(item) {
  return `/${item.collection}/${item.slug}`;
}

function navigate(path) {
  if (path === window.location.pathname) return;
  history.pushState({}, "", path);
  render();
  window.scrollTo(0, 0);
}

function activeClass(name) {
  const { collection } = routeToParts();
  return collection === name ? "active" : "";
}

function layout(inner) {
  const path = getPath();
  return `
    <div class="site-shell">
      <header class="site-header">
        <div>
          <a href="/" data-link class="site-name">Darren Blaylock</a>
          <p class="site-line">${SITE.line}</p>
          <div class="route-indicator">blaylock@site:<span>${escapeHtml(path)}</span><span class="cursor">_</span></div>
        </div>
        <nav class="nav">
          ${nav.map(n => `<a href="/${n}" data-link class="${activeClass(n)}">/${n}</a>`).join("")}
        </nav>
      </header>
      <main>${inner}</main>
      <footer class="footer">
        ${SITE.links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}
        <span>generated: ${(content.generatedAt || "local").slice(0, 10)}</span>
      </footer>
    </div>
  `;
}

function identityStrip() {
  return `
    <section class="identity-strip">
      <div class="identity-photo">
        <img src="${SITE.profileImage}" alt="${SITE.name}" />
      </div>
      <div class="identity-copy">
        <p class="small prompt">~/profile</p>
        <h2>${SITE.name}</h2>
        <p class="identity-role">"Rust or bust." - someone, somewhere (it sounds tuff)</p>
        <p>${SITE.bio}</p>
      </div>
    </section>
  `;
}

function row(item) {
  const icon = item.icon || "/images/post-icons/default.svg";
  return `
    <a href="${postUrl(item)}" data-link class="directory-row">
      <img class="row-icon" src="${icon}" alt="" />
      <span class="row-path">/${item.collection}/${item.slug}</span>
      <span class="row-main">${escapeHtml(item.title)}</span>
      <span class="row-desc">${escapeHtml(item.summary || "")}</span>
      <span class="row-meta">
        ${renderBadge(item.badge)}
        <span>${escapeHtml(item.date || item.status || "")}</span>
      </span>
    </a>
  `;
}

function sectionList(label, title, items, empty = "nothing here yet") {
  return `
    <section class="section">
      <div class="section-head">
        <span>${label}</span>
        <h2>${title}</h2>
      </div>
      ${items.length ? `<div class="directory-list">${items.map(row).join("")}</div>` : `<div class="empty-state">${empty}</div>`}
    </section>
  `;
}

function homePage() {
  const latest = [...(content.all || [])].filter(x => x.collection !== "work").slice(0, 5);
  const featured = (content.collections.features || []).slice(0, 3);
  const projects = (content.collections.projects || []).slice(0, 4);
  const thoughts = content.collections.thoughts || [];
  const work = (content.collections.work || []).slice(0, 4);

  return layout(`
    ${identityStrip()}
    <section class="hero">
      <p class="prompt">~/index</p>
      <h1>posts first. projects second. everything else is evidence.</h1>
      <p>A minimal archive for blog posts, current builds, old-code retrospectives, and small notes from whatever I’m trying to understand next.</p>
    </section>

    ${sectionList("recent", "main writing", latest)}
    ${sectionList("features", "featured dig-ins", featured, "feature slot is empty")}
    ${sectionList("projects", "current stuff", projects, "no active projects yet")}

    <section class="section">
      <div class="section-head"><span>status</span><h2>now-ish</h2></div>
      <div class="status-grid">
        <p><span>building</span>orderbook / exchange sim</p>
        <p><span>reading</span>thread dumps(?) stack trace unwinding and instruction pointers</p>
        <p><span>writing</span>old project retrospectives</p>
        <p><span>vibe</span>ai workshops are so boring</p>
      </div>
    </section>

    ${sectionList("thoughts", "coming soon / 404", thoughts, "thoughts incoming")}
    ${sectionList("work", "experience + creds", work, "work section is empty")}
  `);
}

function collectionPage(collection) {
  const items = content.collections[collection] || [];
  const copy = {
    posts: ["posts", "blog posts and notes are the main focus.", "Longer writing, learning notes, and explanations to myself."],
    projects: ["projects", "current stuff I’m working on.", "Orderbook, Tokio taskdumps, Rust experiments, and anything else alive enough to track."],
    retrospectives: ["retrospectives", "old projects, reread with better taste.", "What was cursed, what was clever, and what I would build differently now."],
    features: ["features", "spotlight posts.", "A few deeper writeups I want people to actually open."],
    thoughts: ["thoughts", "coming soon.", "This section exists mostly as a promise and a threat."],
    work: ["work", "experience and credentials.", "Internships, school, contributions, and proof that the chaos occasionally compiles."]
  }[collection] || [collection, collection, ""];

  return layout(`
    <section class="page-title">
      <p class="small prompt">~/${collection}</p>
      <h1>${copy[1]}</h1>
      <p>${copy[2]}</p>
    </section>
    <input class="search" id="search" placeholder="grep ${collection}..." />
    <div class="directory-list" id="listing">${items.map(row).join("") || `<div class="empty-state">nothing here yet</div>`}</div>
  `);
}

function renderSection(section, index) {
  const id = sectionAnchor(section, index);

  if (section.type === "list") {
    return `
      <section class="post-section" id="${id}">
        ${renderHeading(section)}
        ${section.body ? paragraphs(section.body) : ""}
        <ul>
          ${(section.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  if (section.type === "code") {
    const language = section.language || "python";

    return `
      <section class="post-section" id="${id}">
        ${renderHeading(section)}
        ${section.body ? paragraphs(section.body) : ""}
        <pre class="code-block language-${escapeHtml(language)}"><code class="language-${escapeHtml(language)}">${escapeHtml(section.code || "")}</code></pre>
      </section>
    `;
  }

  if (section.type === "image") {
    return `
      <section class="post-section" id="${id}">
        ${renderHeading(section)}
        ${section.body ? paragraphs(section.body) : ""}
        <figure>
          <img src="${escapeHtml(section.src || "")}" alt="${escapeHtml(section.alt || "")}" />
          ${section.caption ? `<figcaption>${escapeHtml(section.caption)}</figcaption>` : ""}
        </figure>
      </section>
    `;
  }

  return `
    <section class="post-section" id="${id}">
      ${renderHeading(section)}
      ${section.body ? paragraphs(section.body) : ""}
    </section>
  `;
}

function paragraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map(p => `<p>${inlineText(p).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function detailPage(item) {
  return layout(`
    <article class="post-page">
      <a class="back-link" href="/${item.collection}" data-link>← /${item.collection}</a>
      <header class="post-header">
        <p class="small prompt">/${item.collection}/${item.slug}</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.summary || "")}</p>
        <div class="post-meta">
          ${renderBadge(item.badge)}
          <span>${escapeHtml(item.date || "")}</span>
          <span>${escapeHtml(item.type || COLLECTIONS[item.collection]?.singular || "post")}</span>
          ${(item.tags || []).map(tag => `<span>#${escapeHtml(tag)}</span>`).join("")}
        </div>
      </header>
      <div class="post-layout">
        ${renderPostToc(item)}

        <article class="post-body">
          ${(item.sections || []).map((section, index) => renderSection(section, index)).join("")}
        </article>
      </div>
    </article>
  `);
}

function notFoundPage() {
  return layout(`
    <section class="page-title">
      <p class="small prompt">404</p>
      <h1>file not found.</h1>
      <p>Either this page moved, never existed, or is still sitting in a notes file somewhere.</p>
      <a class="inline-link" href="/" data-link>back home</a>
    </section>
  `);
}

function attachSearch(collection) {
  const input = $("#search");
  const listing = $("#listing");
  if (!input || !listing) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    const items = (content.collections[collection] || []).filter(item => {
      return [item.title, item.summary, item.slug, ...(item.tags || [])].join(" ").toLowerCase().includes(q);
    });
    listing.innerHTML = items.length ? items.map(row).join("") : `<div class="empty-state">no matches</div>`;
  });
}

function render() {
  const { collection, slug } = routeToParts();
  let html;

  if (collection === "home") html = homePage();
  else if (COLLECTIONS[collection] && slug) {
    const item = (content.collections[collection] || []).find(x => x.slug === slug);
    html = item ? detailPage(item) : notFoundPage();
  } else if (COLLECTIONS[collection]) html = collectionPage(collection);
  else html = notFoundPage();

  document.getElementById("app").innerHTML = html;
  if (window.Prism) {
    window.Prism.highlightAll();
  }
  if (COLLECTIONS[collection] && !slug) attachSearch(collection);
}

function renderHeading(section) {
  return section.heading && section.heading.trim()
    ? `<h2>${escapeHtml(section.heading)}</h2>`
    : "";
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(url.pathname);
});

window.addEventListener("popstate", render);
render();
