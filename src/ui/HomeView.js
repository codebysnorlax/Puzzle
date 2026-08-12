import { SettingsStore } from "../storage/SettingsStore.js";
import { ImageStore } from "../storage/ImageStore.js";
import { APP_VERSION } from "../app/AppVersion.js";
import { escapeHtml, validateImageFile } from "../utils/security.js";
import { PuzzleStatusStore } from "../storage/PuzzleStatusStore.js";
import { VisitorTracker } from "../services/VisitorTracker.js";

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
    this.onCallPuzzles = [];
    this.chunkSize = 12;
    this.displayedCount = 25;
    this.selectedImage = "./images/demo.webp";
    this.selectedImageId =
      localStorage.getItem("last_played_image_id") || "demo1";
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
      // DB-First: Load any on-call puzzles that are ALREADY in IndexedDB
      this.onCallPuzzles = await ImageStore.getOnCallPuzzlesFromDB();

      // Ensure selected image reference is valid
      const selectedItem = [
        ...this.customImages,
        ...this.builtinPuzzles,
        ...this.onCallPuzzles,
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
              <img src="https://avatars.githubusercontent.com/codebysnorlax" alt="nr_snorlax Instagram" />
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
            <span id="gallery-count-badge" class="gallery-count-badge">
              23 Puzzles Available
            </span>
          </div>

          <div class="image-grid" id="image-grid"></div>

          <div id="load-more-wrap" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: var(--space-4);">
            <button class="btn btn-secondary" id="btn-load-more" style="display: none;">Load More Puzzles</button>

            <button class="btn btn-secondary" id="btn-call-more-puzzles">call_more_image</button>
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

    // ── Deduplicate and Classify all items into 3 sections ──────────────────────
    const rawItems = [
      ...this.customImages,
      ...this.builtinPuzzles,
      ...this.onCallPuzzles,
    ];
    const seenIds = new Set();
    const allItems = [];
    for (const item of rawItems) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }

    // Section 1: User uploads
    const uploadedItems = allItems.filter((img) => img.isCustom);

    // Section 2: History — anything user has touched (completed / started / quit)
    const historyItems = allItems.filter((img) => {
      if (img.isCustom) return false;
      const s = PuzzleStatusStore.getStatus(img.id);
      return s === "completed" || s === "started" || s === "quit";
    });

    // Section 3: Untouched — no status, not custom
    const untouchedItems = allItems.filter((img) => {
      if (img.isCustom) return false;
      const s = PuzzleStatusStore.getStatus(img.id);
      return !s;
    });

    const totalInteracted = uploadedItems.length + historyItems.length;
    const totalAll = allItems.length;

    const countBadge = this.element.querySelector("#gallery-count-badge");
    if (countBadge) {
      const storedCount = allItems.filter((i) => Boolean(i.blob)).length;
      countBadge.textContent = `${totalAll} Puzzles Available ${storedCount > 0 ? `• ${storedCount} Stored in DB` : ""}`;
    }

    const loadMoreBtn = this.element.querySelector("#btn-load-more");
    if (loadMoreBtn) loadMoreBtn.style.display = "none";

    // Hide call_more_image button if all on-call puzzles have been called / loaded
    const callMoreBtn = this.element.querySelector("#btn-call-more-puzzles");
    if (callMoreBtn) {
      const onCallCatalog = ImageStore.getOnCallCatalog();
      const isCalled =
        localStorage.getItem("on_call_puzzles_called") === "true";
      const isAllLoaded =
        this.onCallPuzzles && this.onCallPuzzles.length >= onCallCatalog.length;
      if (isCalled || isAllLoaded) {
        callMoreBtn.classList.add("hidden-button");
        callMoreBtn.style.display = "none";
      } else {
        callMoreBtn.classList.remove("hidden-button");
        callMoreBtn.style.display = "inline-flex";
      }
    }

    // ── Card builder helper ──────────────────────────────────────────────────────
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

      // Revealed = custom uploads OR explicitly completed in history section
      const isRevealed = img.isCustom || forceReveal;

      return `
        <div class="image-card ${isSelected ? "selected" : ""} ${statusClass} ${isRevealed ? "card-revealed" : ""}" data-url="${displaySrc}" data-id="${escapeHtml(img.id)}" data-name="${escapedName}">
          <div class="image-card-skeleton"></div>
          <img src="${displaySrc}" alt="${escapedName}" loading="lazy" onload="this.classList.add('is-loaded'); this.previousElementSibling?.classList.add('loaded');" onerror="this.previousElementSibling?.classList.add('loaded');" />
          ${!isRevealed ? `<div class="image-card-noise-overlay"></div>` : ""}
          ${isCachedLocally ? `<div class="image-card-cached-dot ${img.isCustom ? "custom-dot" : ""}" title="Stored Locally in IndexedDB"></div>` : ""}

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
            img.isCustom
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

    const dashedDivider = (label) => `
      <div class="gallery-section-divider">
        <div class="gallery-divider-line"></div>
        <span class="gallery-divider-label">${label}</span>
        <div class="gallery-divider-line"></div>
      </div>
    `;

    // ── Assemble grid ────────────────────────────────────────────────────────────
    grid.innerHTML = `
      <!-- ── Section 1: Upload Card + User Uploads ── -->
      <div class="image-card image-card-upload" id="upload-card">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span style="font-size: 0.74rem; font-weight: 600;">Upload</span>
        <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" style="display: none;" />
      </div>
      ${uploadedItems.map((img) => buildCard(img, true)).join("")}

      <!-- ── Dashed Divider 1: Uploads → History ── -->
      ${dashedDivider("History")}

      <!-- ── Section 2: History — completed shown clear, others hidden ── -->
      ${
        historyItems.length > 0
          ? historyItems
              .map((img) => {
                const status = PuzzleStatusStore.getStatus(img.id);
                return buildCard(img, status === "completed");
              })
              .join("")
          : `<div class="gallery-empty-hint">No history yet. Start a puzzle to see it here.</div>`
      }

      <!-- ── Dashed Divider 2: History → Untouched ── -->
      ${dashedDivider("Untouched")}

      <!-- ── Section 3: Untouched — all blurred/mystery ── -->
      ${untouchedItems.map((img) => buildCard(img, false)).join("")}
    `;

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

    const cards = grid.querySelectorAll(".image-card:not(.image-card-upload)");
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
            this.selectedImageId = "demo1";
            this.selectedImage = "./images/demo.webp";
            localStorage.setItem("last_played_image_id", "demo1");
          }
          this.updateGalleryGrid();
        }
      });
    });

    const uploadCard = grid.querySelector("#upload-card");
    const fileInput = grid.querySelector("#file-input");
    if (uploadCard && fileInput) {
      uploadCard.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          // Security validation check before processing or saving
          const validation = validateImageFile(file);
          if (!validation.valid) {
            alert(`Upload Failed: ${validation.error}`);
            fileInput.value = "";
            return;
          }

          const countBadge = this.element.querySelector("#gallery-count-badge");
          if (countBadge) countBadge.classList.add("btn-shine");
          try {
            const savedRecord = await ImageStore.saveImage(
              file,
              validation.sanitizedName,
            );
            this.customImages.unshift(savedRecord);
            this.selectedImage = savedRecord.url;
            this.selectedImageId = savedRecord.id;
            this.updateGalleryGrid();
          } catch (err) {
            console.warn("[HomeView] Save custom image failed:", err);
            alert(`Failed to save image: ${err.message || "Storage error"}`);
          } finally {
            if (countBadge) countBadge.classList.remove("btn-shine");
          }
        }
      });
    }
  }

  bindEvents() {
    const btnLoadMore = this.element.querySelector("#btn-load-more");
    if (btnLoadMore) {
      btnLoadMore.addEventListener("click", () => {
        this.displayedCount += this.chunkSize;
        this.updateGalleryGrid();
      });
    }

    // "call_more_image" Button — fetch on-call puzzles into DB then refresh grid
    const callMoreBtn = this.element.querySelector("#btn-call-more-puzzles");
    if (callMoreBtn) {
      callMoreBtn.addEventListener("click", async () => {
        // Prevent double-clicks / re-entry
        if (this._onCallLoading) return;

        // Mark as called and hide button immediately (avoiding any "loading" text in button)
        this._onCallLoading = true;
        localStorage.setItem("on_call_puzzles_called", "true");
        callMoreBtn.classList.add("hidden-button");
        callMoreBtn.style.display = "none";

        const grid = this.element.querySelector("#image-grid");
        const countBadge = this.element.querySelector("#gallery-count-badge");
        if (countBadge) countBadge.classList.add("btn-shine");

        try {
          const catalog = ImageStore.getOnCallCatalog();

          // Fetch each on-call image 1-by-1 and store in IndexedDB 1-by-1 (sequential loop)
          for (const item of catalog) {
            const dbImage = await ImageStore.getImage(item.id);
            let imgData = null;

            if (dbImage && dbImage.blob && dbImage.blob.size > 0) {
              // Image is already cached in IndexedDB
              imgData = { ...dbImage, isCustom: false, isOnCall: true };
            } else {
              // Image is not in DB: show placeholder with skeleton loading animation
              if (grid) {
                const placeholder = document.createElement("div");
                placeholder.className = "image-card";
                placeholder.id = `placeholder-${item.id}`;
                placeholder.innerHTML = `<div class="image-card-skeleton"></div>`;
                grid.appendChild(placeholder);
              }

              // Fetch from CDN and store in IndexedDB (1-by-1 sequentially)
              try {
                imgData = await ImageStore.fetchAndCacheSingleOnCall(item);
              } catch (e) {
                console.warn(
                  `[HomeView] Failed to fetch/cache on-call puzzle ${item.id}:`,
                  e,
                );
                document.getElementById(`placeholder-${item.id}`)?.remove();
              }
            }

            // Once stored, render the card (the image will load and fade the skeleton out)
            if (imgData && grid) {
              const displaySrc = imgData.blob
                ? URL.createObjectURL(imgData.blob)
                : imgData.url;
              const escapedName = escapeHtml(imgData.name);
              const escapedId = escapeHtml(imgData.id);

              const cardHtml = `
                <div class="image-card" data-url="${displaySrc}" data-id="${escapedId}" data-name="${escapedName}">
                  <div class="image-card-skeleton"></div>
                  <img src="${displaySrc}" alt="${escapedName}" loading="lazy" onload="this.classList.add('is-loaded'); this.previousElementSibling?.classList.add('loaded');" onerror="this.previousElementSibling?.classList.add('loaded');" />
                  <div class="image-card-noise-overlay"></div>
                  <div class="image-card-cached-dot" title="Stored Locally in IndexedDB"></div>
                  <div class="image-card-mystery-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Mystery
                  </div>
                  <button class="image-card-start-btn" data-start-id="${escapedId}" title="Start Puzzle">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>Start</span>
                  </button>
                </div>
              `;

              const placeholderEl = document.getElementById(
                `placeholder-${item.id}`,
              );
              if (placeholderEl) {
                placeholderEl.outerHTML = cardHtml;
              } else {
                // If it was already in DB (or if placeholder element wasn't found), append it to the grid
                // Avoid duplicating if it somehow got rendered
                if (!grid.querySelector(`[data-id="${escapedId}"]`)) {
                  const cardWrapper = document.createElement("div");
                  cardWrapper.innerHTML = cardHtml.trim();
                  const cardElement = cardWrapper.firstChild;
                  grid.appendChild(cardElement);
                }
              }
            }
          }

          // Refresh the full catalog from DB to guarantee correct order, category division, and deduplication
          await this.refreshCatalog();
        } catch (err) {
          console.warn("[HomeView] Failed to call on-demand puzzles:", err);
        } finally {
          if (countBadge) countBadge.classList.remove("btn-shine");
          callMoreBtn.classList.add("hidden-button");
          callMoreBtn.style.display = "none";
          this._onCallLoading = false;
        }
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
