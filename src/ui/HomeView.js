import { SettingsStore } from "../storage/SettingsStore.js";
import { ImageStore } from "../storage/ImageStore.js";
import { APP_VERSION } from "../app/AppVersion.js";
import { escapeHtml, validateImageFile } from "../utils/security.js";
import { PuzzleStatusStore } from "../storage/PuzzleStatusStore.js";
import { VisitorTracker } from "../services/VisitorTracker.js";

/**
 * Generates a deterministic 3-digit ID from a string ID,
 * ensuring that all 3 digits are unique.
 * @param {string} originalId
 * @returns {string}
 */
export function getDeterministic3DigitId(originalId) {
  if (!originalId) return "123";
  let hash = 0;
  for (let i = 0; i < originalId.length; i++) {
    hash = originalId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Pick first digit (1-9 to avoid leading zero)
  const firstIdx = (hash % 9) + 1;
  const firstDigit = digits.splice(firstIdx, 1)[0];

  // Pick second digit (0-9 excluding first)
  const secondIdx = (hash >> 3) % 9;
  const secondDigit = digits.splice(secondIdx, 1)[0];

  // Pick third digit (0-9 excluding first and second)
  const thirdIdx = (hash >> 6) % 8;
  const thirdDigit = digits.splice(thirdIdx, 1)[0];

  return `${firstDigit}${secondDigit}${thirdDigit}`;
}

/**
 * HomeView — Clean Navbar with Radio Difficulty & IndexedDB-First WebP Gallery
 */
export class HomeView {
  constructor(container, onStartGame, app = null) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.app = app;

    this.builtinPuzzles = [];
    this.customImages = [];
    this.activeTab = "library";
    this._chaosLoading = false;
    this._calmLoading = false;
    this.chunkSize = 12;
    this.displayedCount = 25;
    this.selectedImage = "./assets/puzzle/puzzle_1.webp";
    this.selectedImageId =
      localStorage.getItem("last_played_image_id") || "puzzle_1";
    this.selectedDifficulty = "normal";

    this.render();
    this.initImagesAndCaching();
  }

  async initImagesAndCaching() {
    // 0. Fetch Unique & Total visitor statistics
    VisitorTracker.recordAndGetStats()
      .then((stats) => {
        const navCount = this.element.querySelector("#nav-unique-count");
        if (navCount) {
          VisitorTracker.updateElementWithAnimation(
            navCount,
            stats.uniqueFormatted,
          );
        }
      })
      .catch((err) => {
        console.warn("[HomeView] VisitorTracker error:", err);
      });

    // 1. Initial render with local/cached data
    await this.refreshCatalog();

    // 2. Ensure all built-in images are cached 1-by-1 into IndexedDB
    ImageStore.ensureAllCached((curr, total) => {
      const countBadge = this.element.querySelector("#gallery-count-badge");
      if (countBadge && localStorage.getItem("puzzles_cached") !== "true") {
        countBadge.classList.add("btn-shine");
        countBadge.textContent = `Caching Offline Puzzles (${curr}/${total})...`;
      }
    })
      .then(() => {
        const countBadge = this.element.querySelector("#gallery-count-badge");
        if (countBadge) countBadge.classList.remove("btn-shine");
        this.refreshCatalog();
      })
      .catch((err) => {
        const countBadge = this.element.querySelector("#gallery-count-badge");
        if (countBadge) countBadge.classList.remove("btn-shine");
        console.warn("[HomeView] Image caching error:", err);
      });
  }

  async refreshCatalog() {
    try {
      this.builtinPuzzles = await ImageStore.getAllBuiltinImages();
      this.customImages = await ImageStore.getCustomImages();

      // Ensure selected image reference is valid
      const selectedItem = [
        ...this.customImages,
        ...this.builtinPuzzles,
      ].find((img) => img.id === this.selectedImageId);
      if (selectedItem) {
        this.selectedImage = selectedItem.blob
          ? URL.createObjectURL(selectedItem.blob)
          : selectedItem.url;
      }

      this.updateGalleryGrid();
    } catch (err) {
      console.warn("[HomeView] Catalog refresh error:", err);
    }
  }

  updatePwaInstallState(show) {
    const installBtn = this.element.querySelector("#btn-pwa-install-home");
    if (installBtn) {
      installBtn.style.display = show ? "inline-flex" : "none";
    }
  }

  render() {
    const currentTheme = SettingsStore.getSettings().theme || "light";
    const canInstall = Boolean(this.app && this.app.deferredInstallPrompt);

    this.element = document.createElement("div");
    this.element.className = "view home-view active";

    this.element.innerHTML = `
      <nav class="top-nav">
        <div class="nav-inner">
          <div class="nav-left">
            <a href="https://www.instagram.com/nr_snorlax" target="_blank" rel="noopener noreferrer" class="nav-avatar" title="Follow @nr_snorlax on Instagram">
              <img src="./assets/avatar.png" alt="nr_snorlax Instagram" />
            </a>
            <span class="nav-brand">Puzzle</span>

            <div class="nav-visitor-badge" title="Unique Visitors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span id="nav-unique-count" class="count-animated">...</span>
            </div>
          </div>

          <div class="nav-center">
            <div class="diff-radio-group" data-selected="${this.selectedDifficulty === "expert" || this.selectedDifficulty === "hard" ? "expert" : "normal"}">
              <label class="diff-radio">
                <input type="radio" name="difficulty" value="normal" ${this.selectedDifficulty !== "expert" && this.selectedDifficulty !== "hard" ? "checked" : ""} />
                <span>Normal</span>
              </label>
              <label class="diff-radio">
                <input type="radio" name="difficulty" value="expert" ${this.selectedDifficulty === "expert" || this.selectedDifficulty === "hard" ? "checked" : ""} />
                <span>Expert</span>
              </label>
            </div>
          </div>

          <div class="nav-right">
            <button class="nav-btn nav-btn-ghost" id="btn-pwa-install-home" title="Download / Install Application" style="display: ${canInstall ? "inline-flex" : "none"};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="1" x2="12" y2="3"/></svg>
            </button>

            <button class="nav-btn nav-btn-ghost" id="btn-hard-refresh-home" title="Hard Refresh App (Clear cache & fix bugs without deleting images)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>

            <button class="nav-btn nav-btn-ghost nav-btn-danger" id="btn-reset-db-nav" title="Reset Database from Fresh (Clears IndexedDB & localStorage with confirmation)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>

            <button class="nav-btn nav-btn-ghost" id="home-theme-toggle-single" title="Toggle Theme">
              ${
                currentTheme === "dark"
                  ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              `
                  : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              `
              }
            </button>
          </div>
        </div>
      </nav>

      <main class="home-main-content">
        <section class="flat-section">
          <div class="gallery-header-row">
            <div class="gallery-tabs" data-active-tab="${this.activeTab}">
              <div class="gallery-tab-btn active" id="gallery-tab-library">Library</div>
              <div class="gallery-tab-btn" id="gallery-tab-chaos">Chaos</div>
              <div class="gallery-tab-btn" id="gallery-tab-calm">Calm</div>
              <div class="gallery-tab-btn" id="gallery-tab-upload">Upload</div>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <span id="gallery-count-badge" class="gallery-count-badge">
                23 Puzzles Available
              </span>
            </div>
          </div>

          <div class="image-grid" id="image-grid"></div>

          <div id="load-more-wrap" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: var(--space-4);">
            <button class="btn btn-secondary" id="btn-load-more" style="display: none;">Load More Puzzles</button>
          </div>
        </section>
      </main>
    `;

    this.container.appendChild(this.element);
    this.updateGalleryGrid();
    this.bindEvents();
  }

  updateGalleryGrid() {
    const grid = this.element.querySelector("#image-grid");
    if (!grid) return;

    const countBadge = this.element.querySelector("#gallery-count-badge");

    if (this.activeTab === "calm") {
      ImageStore.getCalmPuzzlesFromDB().then(async (cachedCalm) => {
        const calmCatalog = ImageStore.getCalmCatalog();
        
        if (countBadge) {
          countBadge.textContent = `${calmCatalog.length} Calm Puzzles Available • ${cachedCalm.length} Stored in DB`;
        }

        grid.innerHTML = "";
        
        for (const item of calmCatalog) {
          const cached = cachedCalm.find(c => c.id === item.id);
          const isCachedLocally = Boolean(cached);
          const displaySrc = cached ? URL.createObjectURL(cached.blob) : item.url;
          const escapedName = escapeHtml(item.name);
          const escapedId = escapeHtml(item.id);
          const status = PuzzleStatusStore.getStatus(item.id);

          let statusClass = "";
          if (status === "completed") statusClass = "status-completed";
          else if (status === "started") statusClass = "status-started";
          else if (status === "quit") statusClass = "status-quit";

          const cardHtml = `
            <div class="image-card ${statusClass} ${status === 'completed' ? 'card-revealed' : ''}" data-url="${displaySrc}" data-id="${escapedId}" data-name="${escapedName}">
              <div class="image-card-skeleton ${isCachedLocally ? 'loaded' : ''}"></div>
              <img src="${displaySrc}" alt="${escapedName}" class="${isCachedLocally ? 'is-loaded' : ''}" loading="lazy" onload="this.classList.add('is-loaded'); this.previousElementSibling?.classList.add('loaded');" onerror="this.previousElementSibling?.classList.add('loaded');" crossorigin="anonymous" />
              <div class="image-card-id-badge">ID: ${getDeterministic3DigitId(item.id)}</div>
              ${status !== 'completed' ? `<div class="image-card-noise-overlay"></div>` : ""}
              ${isCachedLocally ? `<div class="image-card-cached-dot" title="Stored Locally in IndexedDB"></div>` : ""}

              ${status ? `
                <div class="image-card-status-badge" title="${status === 'completed' ? 'Finished' : status === 'started' ? 'In Progress' : 'Unfinished'}">
                  <svg width="18" height="14" viewBox="0 0 22 14" fill="none">
                    <path d="M1.5 7.5L5.5 11.5L13.5 2.5" stroke="${status === 'completed' || status === 'started' ? '#38bdf8' : '#94a3b8'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.5 7.5L12.5 11.5L20.5 2.5" stroke="${status === 'completed' ? '#38bdf8' : '#94a3b8'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              ` : ""}

              ${status !== 'completed' ? `
                <div class="image-card-mystery-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Mystery
                </div>
              ` : ""}

              <button class="image-card-start-btn" data-start-id="${escapedId}" title="Start Puzzle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Start</span>
              </button>
            </div>
          `;

          const cardWrapper = document.createElement("div");
          cardWrapper.innerHTML = cardHtml.trim();
          grid.appendChild(cardWrapper.firstChild);
        }

        const moreComingCardHtml = `
          <div class="image-card more-coming-card">
            <div class="more-coming-content">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>More Coming Soon</span>
            </div>
          </div>
        `;
        const moreComingWrapper = document.createElement("div");
        moreComingWrapper.innerHTML = moreComingCardHtml.trim();
        grid.appendChild(moreComingWrapper.firstChild);

        this.bindGalleryEvents();
        this.progressiveCacheCalmPuzzles(cachedCalm);
      });
      return;
    }

    if (this.activeTab === "chaos") {
      ImageStore.getChaosPuzzlesFromDB().then(async (cachedChaos) => {
        const chaosCatalog = ImageStore.getChaosCatalog();
        
        if (countBadge) {
          countBadge.textContent = `${chaosCatalog.length} Chaos Puzzles Available • ${cachedChaos.length} Stored in DB`;
        }

        grid.innerHTML = "";
        
        for (const item of chaosCatalog) {
          const cached = cachedChaos.find(c => c.id === item.id);
          const isCachedLocally = Boolean(cached);
          const displaySrc = cached ? URL.createObjectURL(cached.blob) : item.url;
          const escapedName = escapeHtml(item.name);
          const escapedId = escapeHtml(item.id);
          const status = PuzzleStatusStore.getStatus(item.id);

          let statusClass = "";
          if (status === "completed") statusClass = "status-completed";
          else if (status === "started") statusClass = "status-started";
          else if (status === "quit") statusClass = "status-quit";

          const cardHtml = `
            <div class="image-card ${statusClass} ${status === 'completed' ? 'card-revealed' : ''}" data-url="${displaySrc}" data-id="${escapedId}" data-name="${escapedName}">
              <div class="image-card-skeleton ${isCachedLocally ? 'loaded' : ''}"></div>
              <img src="${displaySrc}" alt="${escapedName}" class="${isCachedLocally ? 'is-loaded' : ''}" loading="lazy" onload="this.classList.add('is-loaded'); this.previousElementSibling?.classList.add('loaded');" onerror="this.previousElementSibling?.classList.add('loaded');" crossorigin="anonymous" />
              <div class="image-card-id-badge">ID: ${getDeterministic3DigitId(item.id)}</div>
              ${status !== 'completed' ? `<div class="image-card-noise-overlay"></div>` : ""}
              ${isCachedLocally ? `<div class="image-card-cached-dot" title="Stored Locally in IndexedDB"></div>` : ""}

              ${status ? `
                <div class="image-card-status-badge" title="${status === 'completed' ? 'Finished' : status === 'started' ? 'In Progress' : 'Unfinished'}">
                  <svg width="18" height="14" viewBox="0 0 22 14" fill="none">
                    <path d="M1.5 7.5L5.5 11.5L13.5 2.5" stroke="${status === 'completed' || status === 'started' ? '#38bdf8' : '#94a3b8'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.5 7.5L12.5 11.5L20.5 2.5" stroke="${status === 'completed' ? '#38bdf8' : '#94a3b8'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              ` : ""}

              ${status !== 'completed' ? `
                <div class="image-card-mystery-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Mystery
                </div>
              ` : ""}

              <button class="image-card-start-btn" data-start-id="${escapedId}" title="Start Puzzle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Start</span>
              </button>
            </div>
          `;

          const cardWrapper = document.createElement("div");
          cardWrapper.innerHTML = cardHtml.trim();
          grid.appendChild(cardWrapper.firstChild);
        }

        this.bindGalleryEvents();
        this.progressiveCacheChaosPuzzles(cachedChaos);
      });
      return;
    }

    const rawItems = [
      ...this.customImages,
      ...this.builtinPuzzles,
    ];
    const seenIds = new Set();
    const allItems = [];
    for (const item of rawItems) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }

    const uploadedItems = allItems.filter((img) => img.isCustom);
    const libraryItems = allItems.filter((img) => !img.isCustom);

    if (this.activeTab === "upload") {
      if (countBadge) {
        countBadge.textContent = `${uploadedItems.length} Uploaded Puzzles Available`;
      }
    } else {
      if (countBadge) {
        const storedCount = libraryItems.filter((i) => Boolean(i.blob)).length;
        countBadge.textContent = `${libraryItems.length} Puzzles Available ${storedCount > 0 ? `• ${storedCount} Stored in DB` : ""}`;
      }
    }

    const loadMoreBtn = this.element.querySelector("#btn-load-more");
    if (loadMoreBtn) loadMoreBtn.style.display = "none";

    const buildCard = (img, forceReveal = false) => {
      const isSelected =
        this.selectedImageId && this.selectedImageId === img.id;
      const displaySrc = img.blob ? URL.createObjectURL(img.blob) : img.url;
      const isCachedLocally = Boolean(img.blob);
      const escapedName = escapeHtml(img.name);
      const status = PuzzleStatusStore.getStatus(img.id);

      let statusClass = "";
      if (status === "completed") statusClass = "status-completed";
      else if (status === "started") statusClass = "status-started";
      else if (status === "quit") statusClass = "status-quit";

      const isCustomImage = img.isCustom || (img.id && img.id.startsWith("custom_img_"));
      const isRevealed = (status === "completed") || forceReveal;

      return `
        <div class="image-card ${isSelected ? "selected" : ""} ${statusClass} ${isRevealed ? "card-revealed" : ""}" data-url="${displaySrc}" data-id="${escapeHtml(img.id)}" data-name="${escapedName}">
          <div class="image-card-skeleton"></div>
          <img src="${displaySrc}" alt="${escapedName}" loading="lazy" onload="this.classList.add('is-loaded'); this.previousElementSibling?.classList.add('loaded');" onerror="this.previousElementSibling?.classList.add('loaded');" />
          <div class="image-card-id-badge">ID: ${getDeterministic3DigitId(img.id)}</div>
          ${!isRevealed ? `<div class="image-card-noise-overlay"></div>` : ""}
          ${isCachedLocally ? `<div class="image-card-cached-dot ${isCustomImage ? "custom-dot" : ""}" title="Stored Locally in IndexedDB"></div>` : ""}

          ${
            status
              ? `
            <div class="image-card-status-badge" title="${
              status === "completed"
                ? "Finished"
                : status === "started"
                  ? "In Progress"
                  : "Unfinished"
            }">
              <svg width="18" height="14" viewBox="0 0 22 14" fill="none">
                <path d="M1.5 7.5L5.5 11.5L13.5 2.5" stroke="${status === "completed" || status === "started" ? "#38bdf8" : "#94a3b8"}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.5 7.5L12.5 11.5L20.5 2.5" stroke="${status === "completed" ? "#38bdf8" : "#94a3b8"}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          `
              : ""
          }

          ${
            !isRevealed
              ? `
            <div class="image-card-mystery-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Mystery
            </div>
          `
              : ""
          }

          ${
            isCustomImage
              ? `
            <button class="image-card-delete" data-delete-id="${escapeHtml(img.id)}" title="Delete">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          `
              : ""
          }

          <button class="image-card-start-btn" data-start-id="${escapeHtml(img.id)}" title="Start Puzzle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Start</span>
          </button>
        </div>
      `;
    };

    if (this.activeTab === "upload") {
      grid.innerHTML = `
        <div class="image-card image-card-upload" id="upload-card">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span style="font-size: 0.74rem; font-weight: 600;">Upload</span>
          <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" multiple style="display: none;" />
        </div>
        ${uploadedItems.map((img) => buildCard(img, false)).join("")}
      `;
    } else {
      grid.innerHTML = libraryItems.map((img) => buildCard(img, false)).join("");
    }
 
    this.bindGalleryEvents();
  }

  async launchGameForPuzzle(id, url) {
    if (this.onStartGame) {
      PuzzleStatusStore.markStarted(id);
      localStorage.setItem("last_played_image_id", id);
      let finalImage = url;

      // STRICT DB-FIRST: Always check IndexedDB first for existing blob!
      const dbImage = await ImageStore.getImage(id);
      if (dbImage && dbImage.blob) {
        finalImage = ImageStore.createTrackedUrl(dbImage.blob);
      } else {
        const builtin = await ImageStore.getBuiltinImage(id);
        if (builtin && builtin.url) {
          finalImage = builtin.url;
        }
      }

      this.onStartGame({
        imageUrl: finalImage,
        imageId: id,
        mode: "normal",
        difficulty: this.selectedDifficulty,
      });
    }
  }

  async processUploadFiles(files) {
    const maxFiles = 5;
    if (files.length === 0) return;

    if (files.length > maxFiles) {
      alert(`Please upload at most ${maxFiles} images at a time.`);
      return;
    }

    const countBadge = this.element.querySelector("#gallery-count-badge");
    if (countBadge) {
      countBadge.classList.add("btn-shine");
      countBadge.textContent = `Uploading ${files.length} images...`;
    }

    let successCount = 0;
    let lastSavedRecord = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(`File "${file.name}" failed validation: ${validation.error}`);
        continue;
      }

      try {
        const savedRecord = await ImageStore.saveImage(
          file,
          validation.sanitizedName,
        );
        this.customImages.unshift(savedRecord);
        lastSavedRecord = savedRecord;
        successCount++;
      } catch (err) {
        console.warn(`[HomeView] Save custom image failed for "${file.name}":`, err);
        alert(`Failed to upload "${file.name}": ${err.message || "Storage error"}`);
      }
    }

    if (countBadge) {
      countBadge.classList.remove("btn-shine");
    }

    if (successCount > 0) {
      if (lastSavedRecord) {
        this.selectedImage = lastSavedRecord.url;
        this.selectedImageId = lastSavedRecord.id;
      }
      this.updateGalleryGrid();
    }
  }



  bindGalleryEvents() {
    const grid = this.element.querySelector("#image-grid");
    if (!grid) return;

    // Instantly hide skeleton for images already cached in browser memory
    const gridImgs = grid.querySelectorAll(".image-card img");
    gridImgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("is-loaded");
        if (
          img.previousElementSibling &&
          img.previousElementSibling.classList.contains("image-card-skeleton")
        ) {
          img.previousElementSibling.classList.add("loaded");
        }
      }
    });

    const cards = grid.querySelectorAll(
      ".image-card:not(.image-card-upload):not(.more-coming-card)"
    );
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".image-card-delete")) return;
        if (e.target.closest(".image-card-start-btn")) return;

        const id = card.dataset.id;
        const url = card.dataset.url;
        const wasSelected = card.classList.contains("selected");

        grid
          .querySelectorAll(".image-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");

        this.selectedImageId = id;
        this.selectedImage = url;

        // If card was already selected, second tap/click starts the puzzle directly!
        if (wasSelected) {
          this.launchGameForPuzzle(id, url);
        }
      });
    });

    const startBtns = grid.querySelectorAll(".image-card-start-btn");
    startBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".image-card");
        const id = card ? card.dataset.id : btn.dataset.startId;
        const url = card ? card.dataset.url : "";
        this.launchGameForPuzzle(id, url);
      });
    });

    const deleteBtns = grid.querySelectorAll(".image-card-delete");
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm("Delete this custom image?")) {
          await ImageStore.deleteImage(id);
          this.customImages = this.customImages.filter((img) => img.id !== id);
          if (this.selectedImageId === id) {
            this.selectedImageId = "puzzle_1";
            this.selectedImage = "./assets/puzzle/puzzle_1.webp";
            localStorage.setItem("last_played_image_id", "puzzle_1");
          }
          this.updateGalleryGrid();
        }
      });
    });

    const uploadCard = grid.querySelector("#upload-card");
    const fileInput = grid.querySelector("#file-input");
    if (uploadCard && fileInput) {
      uploadCard.addEventListener("click", (e) => {
        if (e.target.id === "file-input") return;
        fileInput.click();
      });

      // Drag and drop events for premium bulk drop experience
      uploadCard.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadCard.classList.add("drag-over");
      });

      uploadCard.addEventListener("dragleave", (e) => {
        e.preventDefault();
        uploadCard.classList.remove("drag-over");
      });

      uploadCard.addEventListener("drop", async (e) => {
        e.preventDefault();
        uploadCard.classList.remove("drag-over");
        const files = Array.from(e.dataTransfer.files);
        await this.processUploadFiles(files);
      });

      fileInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        await this.processUploadFiles(files);
        fileInput.value = "";
      });
    }
  }

  bindEvents() {
    const libTab = this.element.querySelector("#gallery-tab-library");
    const chaosTab = this.element.querySelector("#gallery-tab-chaos");
    const calmTab = this.element.querySelector("#gallery-tab-calm");
    const uploadTab = this.element.querySelector("#gallery-tab-upload");

    if (libTab) {
      libTab.addEventListener("click", () => this.switchToTab("library"));
    }
    if (chaosTab) {
      chaosTab.addEventListener("click", () => this.switchToTab("chaos"));
    }
    if (calmTab) {
      calmTab.addEventListener("click", () => this.switchToTab("calm"));
    }
    if (uploadTab) {
      uploadTab.addEventListener("click", () => this.switchToTab("upload"));
    }

    const btnLoadMore = this.element.querySelector("#btn-load-more");
    if (btnLoadMore) {
      btnLoadMore.addEventListener("click", () => {
        this.displayedCount += this.chunkSize;
        this.updateGalleryGrid();
      });
    }

    // PWA Install Button Handler
    const pwaInstallBtn = this.element.querySelector("#btn-pwa-install-home");
    if (pwaInstallBtn) {
      pwaInstallBtn.addEventListener("click", async () => {
        if (this.app) {
          await this.app.promptPwaInstall();
        }
      });
    }

    // Hard Refresh Button Handler
    const hardRefreshBtn = this.element.querySelector("#btn-hard-refresh-home");
    if (hardRefreshBtn) {
      hardRefreshBtn.addEventListener("click", async () => {
        if (this.app) {
          await this.app.hardRefreshApp();
        }
      });
    }

    // Reset Database Navbar Button Handler
    const resetDbNavBtn = this.element.querySelector("#btn-reset-db-nav");
    if (resetDbNavBtn) {
      resetDbNavBtn.addEventListener("click", async () => {
        if (
          confirm(
            "ERASE ALL DATA CONFIRMATION:\n\nAre you sure you want to reset everything like a brand new user?\nThis will erase all custom images, match stats, and puzzle status tracking 100%.\n\nThis action CANNOT be undone!",
          )
        ) {
          resetDbNavBtn.disabled = true;
          await ImageStore.clearAllDatabaseData();
          alert("Reset Complete! The app will now reload.");
          window.location.reload();
        }
      });
    }

    // Theme toggle
    const singleThemeBtn = this.element.querySelector(
      "#home-theme-toggle-single",
    );
    if (singleThemeBtn) {
      singleThemeBtn.addEventListener("click", () => {
        const current = SettingsStore.getSettings().theme || "light";
        const nextTheme = current === "dark" ? "light" : "dark";
        SettingsStore.saveSettings({ theme: nextTheme });
        SettingsStore.applyTheme(nextTheme);
        if (this.app) this.app.onThemeChange(nextTheme);

        this.updateThemeButton(nextTheme);
      });
    }

    // Difficulty radio buttons
    const radios = this.element.querySelectorAll('input[name="difficulty"]');
    const group = this.element.querySelector(".diff-radio-group");
    radios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.selectedDifficulty = e.target.value;
        if (group) group.setAttribute("data-selected", e.target.value);
      });
    });
  }

  show() {
    this.element.classList.add("active");
    // Re-render grid so status badges & section grouping always reflect latest state
    this.updateGalleryGrid();
    const theme = SettingsStore.getSettings().theme || "light";
    this.updateThemeButton(theme);
    

  }

  hide() {
    this.element.classList.remove("active");
  }

  switchToTab(tabId) {
    if (this.activeTab === tabId) return;
    this.activeTab = tabId;

    const tabsContainer = this.element.querySelector(".gallery-tabs");
    if (tabsContainer) {
      tabsContainer.setAttribute("data-active-tab", tabId);
    }

    const libTab = this.element.querySelector("#gallery-tab-library");
    const chaosTab = this.element.querySelector("#gallery-tab-chaos");
    const calmTab = this.element.querySelector("#gallery-tab-calm");
    const uploadTab = this.element.querySelector("#gallery-tab-upload");
    if (libTab) libTab.classList.toggle("active", tabId === "library");
    if (chaosTab) chaosTab.classList.toggle("active", tabId === "chaos");
    if (calmTab) calmTab.classList.toggle("active", tabId === "calm");
    if (uploadTab) uploadTab.classList.toggle("active", tabId === "upload");

    this.updateGalleryGrid();
  }

  async progressiveCacheChaosPuzzles(cachedChaos) {
    if (this._chaosLoading) return;
    this._chaosLoading = true;

    try {
      const chaosCatalog = ImageStore.getChaosCatalog();
      const grid = this.element.querySelector("#image-grid");

      for (const item of chaosCatalog) {
        if (this.activeTab !== 'chaos') break;

        const isAlreadyCached = cachedChaos.some(c => c.id === item.id);
        if (isAlreadyCached) continue;

        try {
          const cachedItem = await ImageStore.fetchAndCacheSingleChaos(item);
          if (cachedItem && grid) {
            const cardEl = grid.querySelector(`[data-id="${item.id}"]`);
            if (cardEl) {
              const imgEl = cardEl.querySelector("img");
              if (imgEl && cachedItem.blob) {
                const url = URL.createObjectURL(cachedItem.blob);
                imgEl.src = url;
                cardEl.setAttribute("data-url", url);

                const dotContainer = cardEl.querySelector(".image-card-cached-dot");
                if (!dotContainer) {
                  const dot = document.createElement("div");
                  dot.className = "image-card-cached-dot";
                  dot.title = "Stored Locally in IndexedDB";
                  cardEl.appendChild(dot);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`[HomeView] Failed to progressively cache chaos image ${item.id}:`, e);
        }
      }

      const currentCached = await ImageStore.getChaosPuzzlesFromDB();
      const countBadge = this.element.querySelector("#gallery-count-badge");
      if (countBadge && this.activeTab === 'chaos') {
        countBadge.textContent = `${chaosCatalog.length} Chaos Puzzles Available • ${currentCached.length} Stored in DB`;
      }
    } finally {
      this._chaosLoading = false;
    }
  }

  async progressiveCacheCalmPuzzles(cachedCalm) {
    if (this._calmLoading) return;
    this._calmLoading = true;

    try {
      const calmCatalog = ImageStore.getCalmCatalog();
      const grid = this.element.querySelector("#image-grid");

      for (const item of calmCatalog) {
        if (this.activeTab !== 'calm') break;

        const isAlreadyCached = cachedCalm.some(c => c.id === item.id);
        if (isAlreadyCached) continue;

        try {
          const cachedItem = await ImageStore.fetchAndCacheSingleCalm(item);
          if (cachedItem && grid) {
            const cardEl = grid.querySelector(`[data-id="${item.id}"]`);
            if (cardEl) {
              const imgEl = cardEl.querySelector("img");
              if (imgEl && cachedItem.blob) {
                const url = URL.createObjectURL(cachedItem.blob);
                imgEl.src = url;
                cardEl.setAttribute("data-url", url);

                const dotContainer = cardEl.querySelector(".image-card-cached-dot");
                if (!dotContainer) {
                  const dot = document.createElement("div");
                  dot.className = "image-card-cached-dot";
                  dot.title = "Stored Locally in IndexedDB";
                  cardEl.appendChild(dot);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`[HomeView] Failed to progressively cache calm image ${item.id}:`, e);
        }
      }

      const currentCached = await ImageStore.getCalmPuzzlesFromDB();
      const countBadge = this.element.querySelector("#gallery-count-badge");
      if (countBadge && this.activeTab === 'calm') {
        countBadge.textContent = `${calmCatalog.length} Calm Puzzles Available • ${currentCached.length} Stored in DB`;
      }
    } finally {
      this._calmLoading = false;
    }
  }



  updateThemeButton(theme) {
    const singleThemeBtn = this.element.querySelector(
      "#home-theme-toggle-single",
    );
    if (!singleThemeBtn) return;
    singleThemeBtn.innerHTML =
      theme === "dark"
        ? `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    `
        : `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    `;
  }
}
