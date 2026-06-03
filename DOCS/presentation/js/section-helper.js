// Carousel JS Helper for CheckApp Section Pages with Horizontal Tabs and Lightbox Sync
let allSectionScreens = [];
let filteredScreens = [];
let currentSlideIndex = 0;
let currentModuleFilter = 'all';

document.addEventListener("DOMContentLoaded", () => {
  if (typeof pagePlatform === 'undefined' || typeof pageRole === 'undefined') {
    console.error("pagePlatform or pageRole globals not defined.");
    return;
  }

  // Load all screens for this platform and role
  allSectionScreens = screenshots.filter(s => s.platform === pagePlatform && s.role === pageRole);

  if (allSectionScreens.length === 0) {
    console.warn("No screens found for this section.");
    return;
  }

  // Build horizontal module filter tabs
  buildModuleTabs();

  // Apply filters
  applyFiltering();

  // Initialize frame styling (browser vs phone)
  initMockupFrame();

  // Bind keyboard navigation
  document.addEventListener("keydown", (e) => {
    const lightbox = document.getElementById("lightbox");
    const isLightboxActive = lightbox && lightbox.classList.contains("active");

    if (e.key === "ArrowLeft") {
      if (isLightboxActive) {
        navigateLightbox(-1);
      } else {
        prevSlide();
      }
    } else if (e.key === "ArrowRight") {
      if (isLightboxActive) {
        navigateLightbox(1);
      } else {
        nextSlide();
      }
    } else if (e.key === "Escape") {
      if (isLightboxActive) {
        closeLightbox();
      }
    }
  });
});

function initMockupFrame() {
  const frame = document.getElementById("carousel-mockup-frame");
  const browserBar = document.getElementById("carousel-browser-bar");
  const phoneNotch = document.getElementById("carousel-phone-notch");

  if (!frame) return;

  if (pagePlatform === 'web') {
    frame.className = "browser-mockup";
    if (browserBar) browserBar.style.display = "flex";
    if (phoneNotch) phoneNotch.style.display = "none";
  } else {
    frame.className = "phone-mockup";
    if (browserBar) browserBar.style.display = "none";
    if (phoneNotch) phoneNotch.style.display = "block";
  }
}

// Build horizontal tabs based on unique modules
function buildModuleTabs() {
  const tabsContainer = document.getElementById("carousel-module-tabs");
  if (!tabsContainer) return;

  // Extract unique modules
  const uniqueModules = [];
  const moduleMap = new Map();

  allSectionScreens.forEach(s => {
    if (!moduleMap.has(s.module)) {
      moduleMap.set(s.module, s.moduleLabel || s.module);
      uniqueModules.push({
        id: s.module,
        label: s.moduleLabel || s.module
      });
    }
  });

  // Sort modules alphabetically
  uniqueModules.sort((a, b) => a.label.localeCompare(b.label));

  // Build HTML
  let html = `
    <button class="carousel-tab-btn active" id="tab-all" onclick="selectModule('all')">
      Todos los Módulos
    </button>
  `;

  uniqueModules.forEach(mod => {
    html += `
      <button class="carousel-tab-btn" id="tab-${mod.id}" onclick="selectModule('${mod.id}')">
        ${mod.label}
      </button>
    `;
  });

  tabsContainer.innerHTML = html;
  
  // Update overall screen count in header
  const countBadge = document.getElementById("section-count");
  if (countBadge) {
    countBadge.innerText = allSectionScreens.length;
  }
}

// Filter click handler
function selectModule(moduleId) {
  currentModuleFilter = moduleId;

  // Toggle active class on buttons
  const buttons = document.querySelectorAll(".carousel-tab-btn");
  buttons.forEach(btn => btn.classList.remove("active"));

  const activeBtn = document.getElementById(`tab-${moduleId}`);
  if (activeBtn) activeBtn.classList.add("active");

  applyFiltering();
}

// Apply filter and rebuild dots
function applyFiltering() {
  if (currentModuleFilter === 'all') {
    filteredScreens = allSectionScreens;
  } else {
    filteredScreens = allSectionScreens.filter(s => s.module === currentModuleFilter);
  }

  buildDots();
  showSlide(0, false); // Load first slide without delay
}

function buildDots() {
  const dotsContainer = document.getElementById("carousel-dots");
  if (!dotsContainer) return;

  dotsContainer.innerHTML = "";
  filteredScreens.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Ir a diapositiva ${index + 1}`);
    dot.onclick = () => showSlide(index, true);
    dotsContainer.appendChild(dot);
  });
}

function showSlide(index, animate = true) {
  if (filteredScreens.length === 0) return;

  // Handle boundary wrapping
  if (index < 0) {
    currentSlideIndex = filteredScreens.length - 1;
  } else if (index >= filteredScreens.length) {
    currentSlideIndex = 0;
  } else {
    currentSlideIndex = index;
  }

  const screen = filteredScreens[currentSlideIndex];
  if (!screen) return;

  const img = document.getElementById("carousel-img");
  const title = document.getElementById("carousel-title");
  const desc = document.getElementById("carousel-desc");
  const moduleBadge = document.getElementById("carousel-module");
  const techList = document.getElementById("carousel-tech-list");
  const counter = document.getElementById("carousel-counter");
  const infoCol = document.querySelector(".carousel-info-col");

  const imagePrefix = "../../";

  if (animate) {
    // Fade out elements
    if (img) img.style.opacity = 0;
    if (infoCol) {
      infoCol.style.opacity = 0;
      infoCol.style.transform = "translateX(15px)";
    }

    setTimeout(() => {
      updateElementsContent();
    }, 150);
  } else {
    updateElementsContent();
  }

  function updateElementsContent() {
    // Update Image
    if (img) {
      img.src = imagePrefix + screen.path;
      img.onload = () => {
        img.style.opacity = 1;
      };
      img.onerror = () => {
        img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect fill='%23f1f5f9' width='100%' height='100%'/><text fill='%2364748b' x='50%' y='50%' font-family='Outfit' font-weight='bold' font-size='20' text-anchor='middle' dominant-baseline='middle'>Captura no Encontrada</text></svg>";
        img.style.opacity = 1;
      };
    }

    // Update Texts
    if (title) title.innerText = screen.title;
    if (desc) desc.innerText = screen.details || screen.description;
    if (moduleBadge) moduleBadge.innerText = screen.moduleLabel;

    // Update Counter
    if (counter) {
      counter.innerText = `${currentSlideIndex + 1} / ${filteredScreens.length}`;
    }

    // Update Tech Pills
    if (techList) {
      techList.innerHTML = "";
      if (screen.tech) {
        screen.tech.forEach(t => {
          const pill = document.createElement("div");
          pill.className = "tech-pill highlight";
          pill.innerText = t;
          techList.appendChild(pill);
        });
      }
    }

    // Fade in text
    if (animate && infoCol) {
      setTimeout(() => {
        infoCol.style.opacity = 1;
        infoCol.style.transform = "translateX(0)";
      }, 50);
    } else if (infoCol) {
      infoCol.style.opacity = 1;
      infoCol.style.transform = "translateX(0)";
    }
  }

  // Update active dot class
  const dots = document.querySelectorAll(".carousel-dot");
  dots.forEach((dot, idx) => {
    if (idx === currentSlideIndex) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

function nextSlide() {
  showSlide(currentSlideIndex + 1, true);
}

function prevSlide() {
  showSlide(currentSlideIndex - 1, true);
}

// Lightbox modal functionality
function openLightbox() {
  const screen = filteredScreens[currentSlideIndex];
  if (!screen) return;

  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const desc = document.getElementById("lightbox-desc");
  const moduleBadge = document.getElementById("lightbox-module");
  const techList = document.getElementById("lightbox-tech");

  const imagePrefix = "../../";

  if (img) {
    img.src = imagePrefix + screen.path;
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth) {
        img.classList.add("portrait");
      } else {
        img.classList.remove("portrait");
      }
    };
    img.onerror = () => {
      img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect fill='%23f1f5f9' width='100%' height='100%'/><text fill='%2364748b' x='50%' y='50%' font-family='Outfit' font-weight='bold' font-size='20' text-anchor='middle' dominant-baseline='middle'>Captura no Encontrada</text></svg>";
    };
  }

  if (title) title.innerText = screen.title;
  if (desc) desc.innerText = screen.details || screen.description;
  if (moduleBadge) moduleBadge.innerText = screen.moduleLabel;

  if (techList) {
    techList.innerHTML = "";
    if (screen.tech) {
      screen.tech.forEach(t => {
        const pill = document.createElement("div");
        pill.className = "tech-pill highlight";
        pill.innerText = t;
        techList.appendChild(pill);
      });
    }
  }

  if (lightbox) {
    lightbox.classList.add("active");
    lightbox.style.display = "grid";
  }
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.classList.remove("active");
    lightbox.style.display = "none";
  }
  document.body.style.overflow = "";
}

function navigateLightbox(direction) {
  showSlide(currentSlideIndex + direction, false);
  openLightbox();
}
