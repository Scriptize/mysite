const SITE = {
  name: "Scriptize",
  line: "systems / rust / bots / thoughts / etc.",
  profileImage: "/images/sitepfp.jpg",
  bio: "I like building things that make my cortisol high but my dopamine higher. Bots, systems, tools, and projects that force me to learn what is actually happening underneath. I’m drawn to Rust, lower-level programming, learning about markets, and seeing people use stuff I worked on.",
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

function isPublicItem(item) {
  return item.status !== "draft";
}

function appearsIn(item, section) {
  return item.collection === section || (item.placements || []).includes(section);
}

function sectionItems(section) {
  return (content.all || [])
    .filter(item => isPublicItem(item))
    .filter(item => appearsIn(item, section))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function getFeaturedItems() {
  return sectionItems("features");
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
        <p class="identity-role">"Rust or bust." - someone, somewhere (it's catchy) </p>
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

const EXPLORE_SECTIONS = [
  {
    collection: "posts",
    title: "Posts",
    description: "Long-form writing about engineering, learning, and life.",
    icon: "✎",
  },
  {
    collection: "projects",
    title: "Projects",
    description: "Things I’ve built, reverse-engineered, and experimented with.",
    icon: "⌘",
  },
  {
    collection: "retrospectives",
    title: "Retrospectives",
    description: "Lessons from older projects and the decisions behind them.",
    icon: "↺",
  },
  {
    collection: "thoughts",
    title: "Thoughts",
    description: "Short notes, observations, and unfinished ideas.",
    icon: "…",
  },
  {
    collection: "work",
    title: "Work",
    description: "Experience, internships, and technical contributions.",
    icon: "▣",
  },
  {
    collection: "features",
    title: "Features",
    description: "A curated collection of writing worth starting with.",
    icon: "★",
  },
];

function renderExploreSection() {
  return `
    <section class="section explore-section" aria-labelledby="explore-heading">
      <div class="section-head">
        <span>directory</span>
        <h2 id="explore-heading">explore</h2>
      </div>

      <div class="explore-grid">
        ${EXPLORE_SECTIONS.map(section => {
          const count =
            section.collection === "features"
              ? getFeaturedItems().length
              : sectionItems(section.collection).length;

          return `
            <a
              class="explore-card"
              href="/${section.collection}/"
              data-link
            >
              <div class="explore-card-top">
                <span class="explore-card-icon" aria-hidden="true">
                  ${section.icon}
                </span>

                <span class="explore-card-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>

              <div class="explore-card-copy">
                <h3>${escapeHtml(section.title)}</h3>
                <p>${escapeHtml(section.description)}</p>
              </div>

              <div class="explore-card-footer">
                <span class="explore-card-count">
                  ${count} ${count === 1 ? "entry" : "entries"}
                </span>

                <span class="explore-card-path">
                  /${escapeHtml(section.collection)}
                </span>
              </div>
            </a>
          `;
        }).join("")}
      </div>
    </section>
  `;
}


function renderFeaturedCarousel(items) {
  if (!items.length) {
    return "";
  }

  return `
    <section
      class="section featured-carousel-section"
      aria-labelledby="featured-carousel-heading"
    >
      <div class="section-head">
        <span>features</span>
        <h2 id="featured-carousel-heading">featured writing</h2>
      </div>

      <div
        class="featured-carousel"
        data-featured-carousel
        aria-label="Featured articles"
        aria-roledescription="carousel"
      >
        <div class="featured-carousel-window">
          ${items.map((item, index) => `
            <article
              class="featured-slide${index === 0 ? " active" : ""}"
              data-featured-slide
              aria-hidden="${index === 0 ? "false" : "true"}"
            >
              <a
                class="featured-slide-link"
                href="${postUrl(item)}"
                data-link
                tabindex="${index === 0 ? "0" : "-1"}"
              >
                <div class="featured-slide-copy">
                  <p class="small prompt">
                    /${escapeHtml(item.collection)}/${escapeHtml(item.slug)}
                  </p>

                  <h3>${escapeHtml(item.title)}</h3>

                  <p class="featured-slide-summary">
                    ${escapeHtml(item.summary || "")}
                  </p>

                  <span class="featured-slide-action">
                    read article →
                  </span>
                </div>

                <div class="featured-slide-media">
                  <img
                    src="${escapeHtml(getThumbnailSrc(item))}"
                    alt=""
                    loading="${index === 0 ? "eager" : "lazy"}"
                  >
                </div>
              </a>
            </article>
          `).join("")}
        </div>

        ${items.length > 1 ? `
          <div class="featured-carousel-controls">
            <button
              type="button"
              data-carousel-previous
              aria-label="Previous featured article"
            >
              ←
            </button>

            <div class="featured-carousel-dots">
              ${items.map((item, index) => `
                <button
                  type="button"
                  class="featured-carousel-dot${index === 0 ? " active" : ""}"
                  data-carousel-dot="${index}"
                  aria-label="Show ${escapeHtml(item.title)}"
                  aria-current="${index === 0 ? "true" : "false"}"
                ></button>
              `).join("")}
            </div>

            <button
              type="button"
              data-carousel-next
              aria-label="Next featured article"
            >
              →
            </button>
          </div>
        ` : ""}
      </div>
    </section>
  `;
}

function homePage() {


  const featured = getFeaturedItems();
  const projects = sectionItems("projects").slice(0, 4);
  const thoughts = sectionItems("thoughts");
  const work = sectionItems("work").slice(0, 4);
  
  const featuredKeys = new Set(
    featured.map(item => `${item.collection}/${item.slug}`)
  );

  const latest = [...(content.all || [])]
    .filter(item => isPublicItem(item))
    .filter(item => item.collection !== "work")
    .filter(item => {
      const key = `${item.collection}/${item.slug}`;
      return !featuredKeys.has(key);
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 3);

  

  return layout(`
    ${identityStrip()}
    <section class="hero">
      <p class="prompt">~/index</p>
      <h1>posts first. projects second. everything else is evidence.</h1>
      <p>A minimal archive for blog posts, current builds, old-code retrospectives, and small notes from whatever I’m trying to understand next.</p>
    </section>

    ${renderFeaturedCarousel(featured)}

    ${sectionList("recent", "main writing", latest)}
    ${renderExploreSection()}

    <section class="closing-quote">
      <blockquote>
          “There are far, far better things ahead than any we leave behind.”
      </blockquote>

      <p>— C.S. Lewis</p>
    </section>
  `);
}

function collectionPage(collection) {
  const items = sectionItems(collection);
  const copy = {
    posts: ["posts", "blog posts and notes are the main focus.", "Longer writing, learning notes, and explanations to myself."],
    projects: ["projects", "current stuff I’m working on.", "Orderbook, Tokio taskdumps, Rust experiments, and anything else alive enough to track."],
    retrospectives: ["retrospectives", "old projects, reread with better taste.", "What was cursed, what was clever, and what I would build differently now."],
    features: ["features", "spotlight posts.", "A few deeper writeups I want people to actually open."],
    thoughts: ["thoughts", "miscellaneous stuff/takes", "catch-all for ideas, fragments, opinions, and longer thoughts"],
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
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${inlineText(p.replace(/\n+/g, " "))}</p>`)
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

function attachFeaturedCarousel() {
  const carousel = $("[data-featured-carousel]");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll("[data-featured-slide]")];
  const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
  const previous = carousel.querySelector("[data-carousel-previous]");
  const next = carousel.querySelector("[data-carousel-next]");

  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let currentIndex = 0;
  let intervalId = null;

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === currentIndex;
      const link = slide.querySelector("a");

      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));

      if (link) {
        link.tabIndex = active ? 0 : -1;
      }
    });

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === currentIndex;

      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", String(active));
    });
  }

  function stopAutoplay() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startAutoplay() {
    if (reduceMotion) return;

    stopAutoplay();

    intervalId = window.setInterval(() => {
      showSlide(currentIndex + 1);
    }, 6500);
  }

  previous?.addEventListener("click", () => {
    showSlide(currentIndex - 1);
    startAutoplay();
  });

  next?.addEventListener("click", () => {
    showSlide(currentIndex + 1);
    startAutoplay();
  });

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.dataset.carouselDot));
      startAutoplay();
    });
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);

  carousel.addEventListener("focusout", event => {
    if (!carousel.contains(event.relatedTarget)) {
      startAutoplay();
    }
  });

  carousel.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") {
      showSlide(currentIndex - 1);
      startAutoplay();
    }

    if (event.key === "ArrowRight") {
      showSlide(currentIndex + 1);
      startAutoplay();
    }
  });

  startAutoplay();
}

function attachSearch(collection) {
  const input = $("#search");
  const listing = $("#listing");
  if (!input || !listing) return;

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    const items = sectionItems(collection).filter(item => {
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
  if (collection === "home") {
    attachFeaturedCarousel();
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


function getThumbnailSrc(item) {
  if (item.thumbnail) return item.thumbnail;

  const firstImage = (item.sections || []).find(section => {
    return section.type === "image" && section.src;
  });

  return firstImage?.src || "/images/site-preview.png";
}

function renderThumbnailCard(item) {
  const src = getThumbnailSrc(item);

  return `
    <figure class="post-thumbnail-card">
      <div class="post-thumbnail-copy">
        <div class="post-thumbnail-kicker">blaylock.io</div>
        <h2>${escapeHtml(item.title || "Untitled")}</h2>
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
      </div>

      <div class="post-thumbnail-media">
        <img src="${escapeHtml(src)}" alt="" />
      </div>
    </figure>
  `;
}

window.addEventListener("popstate", render);
render();
