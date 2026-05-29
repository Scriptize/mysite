const collections = ["posts", "projects", "retrospectives", "features", "thoughts", "work"];

const BADGE_OPTIONS = [
  ["", "none"],
  ["new", "NEW ✨"],
  ["wip", "WIP ⚙️"],
  ["draft", "DRAFT 💭"],
];

const BADGES = {
  new: "NEW ✨",
  wip: "WIP ⚙️",
  draft: "DRAFT 💭",
};

function renderBadge(badge) {
  if (!badge || !BADGES[badge]) return "";
  return `<span class="post-badge">${BADGES[badge]}</span>`;
}

let allContent = { collections: {}, all: [] };
let current = emptyPost();

const root = document.getElementById("studioRoot");
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
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;

  let output = "";
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(input)) !== null) {
    const [raw, label, href] = match;

    output += escapeHtml(input.slice(lastIndex, match.index));

    if (isSafeHref(href)) {
      const external = /^https?:\/\//.test(href);
      output += `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(label)}</a>`;
    } else {
      output += escapeHtml(raw);
    }

    lastIndex = linkPattern.lastIndex;
  }

  output += escapeHtml(input.slice(lastIndex));
  return output;
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

function emptyPost() {
  return {
    title: "Untitled",
    slug: "untitled",
    collection: "posts",
    type: "post",
    date: new Date().toISOString().slice(0, 10),
    status: "draft",
    summary: "",
    tags: [],
    icon: "/images/post-icons/default.svg",
    heroImage: "",
    featured: false,
    badge: "",
    sections: [
      { type: "text", heading: "What I am trying to say", body: "" }
    ]
  };
}

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "request failed");
  return data;
}

async function loadContent() {
  allContent = await api("/api/content");
  render();
}

function setCurrent(item) {
  current = JSON.parse(JSON.stringify(item));
  current.tags = Array.isArray(current.tags) ? current.tags : [];
  current.sections = Array.isArray(current.sections) && current.sections.length ? current.sections : [{ type: "text", heading: "Section", body: "" }];
  render();
}

function updateField(key, value) {
  current[key] = value;
  if (key === "title" && (!current.slug || current.slug === "untitled")) current.slug = slugify(value);
  if (key === "collection") current.type = value === "posts" ? "post" : value.replace(/s$/, "");
  render();
}

function updateSection(index, key, value) {
  current.sections[index][key] = value;
  render();
}

function addSection(type) {
  const section = type === "code"
    ? { type: "code", heading: "Code", language: "rust", code: "" }
    : type === "image"
      ? { type: "image", src: "/images/posts/example.png", alt: "", caption: "" }
      : type === "list"
        ? { type: "list", heading: "Notes", items: ["first item"] }
        : { type: "text", heading: "New section", body: "" };
  current.sections.push(section);
  render();
}

function removeSection(index) {
  current.sections.splice(index, 1);
  if (!current.sections.length) current.sections.push({ type: "text", heading: "Section", body: "" });
  render();
}

function moveSection(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= current.sections.length) return;
  const [section] = current.sections.splice(index, 1);
  current.sections.splice(next, 0, section);
  render();
}

async function save() {
  const status = document.getElementById("saveStatus");
  status.textContent = "saving...";
  try {
    const clean = { ...current, slug: slugify(current.slug || current.title) };
    clean.tags = typeof clean.tags === "string" ? clean.tags.split(",").map(x => x.trim()).filter(Boolean) : clean.tags;
    const data = await api("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean)
    });
    current = data.item;
    status.textContent = `saved ${data.file}`;
    await loadContent();
  } catch (err) {
    status.textContent = err.message;
  }
}

async function removeCurrent() {
  if (!confirm(`Delete ${current.collection}/${current.slug}?`)) return;
  const status = document.getElementById("saveStatus");
  try {
    await api("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection: current.collection, slug: current.slug })
    });
    current = emptyPost();
    status.textContent = "deleted";
    await loadContent();
  } catch (err) {
    status.textContent = err.message;
  }
}

function sidebar() {
  const items = allContent.all || [];
  return `
    <aside class="studio-sidebar">
      <p class="small prompt">~/content</p>
      <p class="notice">Click an existing file to edit it, or create a new one. The save button writes JSON into /content and rebuilds the generated public content file.</p>
      <div class="studio-list">
        ${items.map(item => `
          <button class="studio-item" data-load="${item.collection}/${item.slug}">
            <span class="row-path">/${item.collection}/</span><br />${escapeHtml(item.title)}
          </button>
        `).join("") || `<p class="notice">no content yet</p>`}
      </div>
    </aside>
  `;
}

function field(label, key, type = "text") {
  return `<label>${label}<input value="${escapeHtml(current[key] || "")}" data-field="${key}" type="${type}" /></label>`;
}

function badgeSelect() {
  return `
    <label>badge
      <select data-field="badge">
        ${BADGE_OPTIONS.map(([value, label]) => `
          <option value="${value}" ${current.badge === value ? "selected" : ""}>${label}</option>
        `).join("")}
      </select>
    </label>
  `;
}

function sectionEditor(section, index) {
  const type = section.type || "text";
  const common = `
    <div class="section-tools">
      <span>section ${index + 1} / ${type}</span>
      <span>
        <button class="linklike" data-move="${index},-1">up</button>
        <button class="linklike" data-move="${index},1">down</button>
        <button class="linklike" data-remove-section="${index}">remove</button>
      </span>
    </div>
  `;

  if (type === "code") {
    return `<div class="section-editor">${common}
      <label>heading<input value="${escapeHtml(section.heading || "")}" data-section-field="${index}:heading" /></label>
      <label>language<input value="${escapeHtml(section.language || "")}" data-section-field="${index}:language" /></label>
      <label>code<textarea data-section-field="${index}:code">${escapeHtml(section.code || "")}</textarea></label>
    </div>`;
  }

  if (type === "image") {
    return `<div class="section-editor">${common}
      <label>src<input value="${escapeHtml(section.src || "")}" data-section-field="${index}:src" /></label>
      <label>alt<input value="${escapeHtml(section.alt || "")}" data-section-field="${index}:alt" /></label>
      <label>caption<input value="${escapeHtml(section.caption || "")}" data-section-field="${index}:caption" /></label>
    </div>`;
  }

  if (type === "list") {
    return `<div class="section-editor">${common}
      <label>heading<input value="${escapeHtml(section.heading || "")}" data-section-field="${index}:heading" /></label>
      <label>items, one per line<textarea data-section-list="${index}">${escapeHtml((section.items || []).join("\n"))}</textarea></label>
    </div>`;
  }

  return `<div class="section-editor">${common}
    <label>heading<input value="${escapeHtml(section.heading || "")}" data-section-field="${index}:heading" /></label>
    <label>body<textarea data-section-field="${index}:body">${escapeHtml(section.body || "")}</textarea></label>
  </div>`;
}

function renderPreviewSection(section) {
  const type = section.type || "text";
  if (type === "code") return `<section><h2>${escapeHtml(section.heading || "Code")}</h2><pre><code>${escapeHtml(section.code || "")}</code></pre></section>`;
  if (type === "image") return `<figure><img src="${escapeHtml(section.src || "")}" alt="${escapeHtml(section.alt || "")}" /><figcaption>${escapeHtml(section.caption || "")}</figcaption></figure>`;
  if (type === "list") return `<section><h2>${escapeHtml(section.heading || "Notes")}</h2><ul>${(section.items || []).map(x => `<li>${inlineText(x)}</li>`).join("")}</ul></section>`;
  return `<section><h2>${escapeHtml(section.heading || "Section")}</h2>${paragraphs(section.body || "")}</section>`;
}

function paragraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map(p => `<p>${inlineText(p).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function preview() {
  return `
    <article class="post-page">
      <header class="post-header">
        <p class="small prompt">/${current.collection}/${current.slug}</p>
        <h1>${escapeHtml(current.title)}</h1>
        <p>${escapeHtml(current.summary || "")}</p>
        <div class="post-meta">
          ${renderBadge(current.badge)}
          <span>${escapeHtml(current.date || "")}</span>
          <span>${escapeHtml(current.status || "")}</span>
          ${(current.tags || []).map(tag => `<span>#${escapeHtml(tag)}</span>`).join("")}
        </div>
      </header>
      <div class="post-body">${(current.sections || []).map(renderPreviewSection).join("")}</div>
    </article>
  `;
}

function editor() {
  return `
    <div class="studio-main">
      <section class="page-title">
        <p class="small prompt">~/studio</p>
        <h1>write locally. commit later.</h1>
        <p>No database, no deployed CMS. This page writes JSON files into the repo and regenerates the public content bundle.</p>
      </section>

      <div class="studio-grid">
        <section class="studio-panel">
          <div class="form-row">
            <label>collection
              <select data-field="collection">
                ${collections.map(c => `<option value="${c}" ${current.collection === c ? "selected" : ""}>${c}</option>`).join("")}
              </select>
            </label>
            ${field("date", "date", "date")}
          </div>
          ${field("title", "title")}
          ${field("slug", "slug")}
          <label>summary<textarea data-field="summary">${escapeHtml(current.summary || "")}</textarea></label>
          <div class="form-row">
            ${field("status", "status")}
            ${badgeSelect()}
          </div>

          <div class="form-row">
            ${field("icon path", "icon")}
          </div>
          <label>tags, comma separated<input value="${escapeHtml((current.tags || []).join(", "))}" data-tags /></label>
          <label><input type="checkbox" data-featured ${current.featured ? "checked" : ""} /> featured</label>

          <div class="studio-actions">
            <button class="btn" data-add-section="text">+ text</button>
            <button class="btn" data-add-section="code">+ code</button>
            <button class="btn" data-add-section="image">+ image</button>
            <button class="btn" data-add-section="list">+ list</button>
          </div>

          ${(current.sections || []).map(sectionEditor).join("")}

          <div class="studio-actions">
            <button class="btn primary" id="savePost">save + rebuild</button>
            <button class="btn danger" id="deletePost">delete</button>
          </div>
          <p class="save-status" id="saveStatus"></p>
        </section>

        <section class="studio-output">
          <p class="small prompt">preview</p>
          ${preview()}
        </section>
      </div>
    </div>
  `;
}

function render() {
  root.innerHTML = `<div class="studio-layout">${sidebar()}${editor()}</div>`;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-load]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [collection, slug] = btn.dataset.load.split("/");
      const item = (allContent.collections[collection] || []).find(x => x.slug === slug);
      if (item) setCurrent(item);
    });
  });

  document.querySelectorAll("[data-field]").forEach(input => {
    input.addEventListener("change", () => updateField(input.dataset.field, input.value));
  });

  const tags = document.querySelector("[data-tags]");
  if (tags) tags.addEventListener("change", () => {
    current.tags = tags.value.split(",").map(x => x.trim()).filter(Boolean);
    render();
  });

  const featured = document.querySelector("[data-featured]");
  if (featured) featured.addEventListener("change", () => {
    current.featured = featured.checked;
    render();
  });

  document.querySelectorAll("[data-section-field]").forEach(input => {
    input.addEventListener("change", () => {
      const [index, key] = input.dataset.sectionField.split(":");
      updateSection(Number(index), key, input.value);
    });
  });

  document.querySelectorAll("[data-section-list]").forEach(input => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.sectionList);
      current.sections[index].items = input.value.split("\n").map(x => x.trim()).filter(Boolean);
      render();
    });
  });

  document.querySelectorAll("[data-add-section]").forEach(btn => btn.addEventListener("click", () => addSection(btn.dataset.addSection)));

  document.querySelectorAll("[data-remove-section]").forEach(btn => btn.addEventListener("click", () => removeSection(Number(btn.dataset.removeSection))));
  document.querySelectorAll("[data-move]").forEach(btn => btn.addEventListener("click", () => {
    const [index, direction] = btn.dataset.move.split(",").map(Number);
    moveSection(index, direction);
  }));

  const saveBtn = document.getElementById("savePost");
  if (saveBtn) saveBtn.addEventListener("click", save);
  const deleteBtn = document.getElementById("deletePost");
  if (deleteBtn) deleteBtn.addEventListener("click", removeCurrent);
}

document.getElementById("newPost").addEventListener("click", (event) => {
  event.preventDefault();
  setCurrent(emptyPost());
});

document.getElementById("rebuild").addEventListener("click", async (event) => {
  event.preventDefault();
  await api("/api/rebuild", { method: "POST" });
  await loadContent();
});

loadContent().catch(err => {
  root.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
});
