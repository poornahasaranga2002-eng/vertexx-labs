// Vertexx Labs - Case Study Interactions, Space Starfield, Persistent Audio & Seamless Return Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Cosmic Starfield matching Vertexx Labs main page
    initSpaceStarfield();

    // Initialize Persistent Soundtrack across Case Studies & Main Site
    initCaseStudyAudio();

    // Initialize Live Interactive App Sandboxes (EcoStay, Cozy Comfort, SkillPro)
    initInteractiveSandboxes();

    // Enhanced Interactive Lightbox Modal (Zoom, Pan, Prev/Next Gallery Viewer)
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close-btn');

    // Collect all zoomable UI showcase items (including phone mockups, hero mockups, gallery cards)
    const zoomableCards = Array.from(document.querySelectorAll('.gallery-card, .hero-mockup-wrapper, .phone-mockup')).filter(c => c.querySelector('img'));

    // Mouse-tracking neon glow for gallery cards & meta boxes
    const glowCards = document.querySelectorAll('.gallery-card, .meta-box, .function-card');
    glowCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    if (lightbox && lightboxImg) {
        // Inject interactive HUD controls into lightbox if not already present
        let toolbar = lightbox.querySelector('.lightbox-hud-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.className = 'lightbox-hud-toolbar';
            toolbar.innerHTML = `
                <div class="lightbox-hud-left">
                    <span id="lightbox-counter" class="lightbox-counter">[ SCREEN 01 / 01 ]</span>
                    <span id="lightbox-hud-title" class="lightbox-hud-title">UI INSPECTION VIEW</span>
                </div>
                <div class="lightbox-hud-controls">
                    <button type="button" id="lb-zoom-out" class="lb-ctrl-btn" title="Zoom Out (-)">[ &minus; ]</button>
                    <span id="lb-zoom-level" class="lb-zoom-readout">100%</span>
                    <button type="button" id="lb-zoom-in" class="lb-ctrl-btn" title="Zoom In (+)">[ + ]</button>
                    <button type="button" id="lb-zoom-reset" class="lb-ctrl-btn" title="Reset Zoom (0)">[ RESET ]</button>
                    <button type="button" id="lb-close-top" class="lb-ctrl-btn lb-close-accent" title="Close (Esc)">[ CLOSE ESC ]</button>
                </div>
            `;
            lightbox.prepend(toolbar);
        }

        // Hide legacy standalone close button if toolbar has its own
        if (closeBtn) closeBtn.style.display = 'none';

        let prevBtn = lightbox.querySelector('.lb-nav-prev');
        let nextBtn = lightbox.querySelector('.lb-nav-next');
        if (!prevBtn) {
            prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'lb-nav-btn lb-nav-prev';
            prevBtn.innerHTML = '&#10094;';
            prevBtn.title = 'Previous Screen (Left Arrow)';
            lightbox.appendChild(prevBtn);
        }
        if (!nextBtn) {
            nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'lb-nav-btn lb-nav-next';
            nextBtn.innerHTML = '&#10095;';
            nextBtn.title = 'Next Screen (Right Arrow)';
            lightbox.appendChild(nextBtn);
        }

        let hintBar = lightbox.querySelector('.lightbox-hint-bar');
        if (!hintBar) {
            hintBar = document.createElement('div');
            hintBar.className = 'lightbox-hint-bar';
            hintBar.innerHTML = '[ SCROLL OR DOUBLE-CLICK TO ZOOM &bull; DRAG TO PAN DETAILS &bull; &larr;/&rarr; TO SWITCH SCREENS ]';
            lightbox.appendChild(hintBar);
        }

        const counterEl = document.getElementById('lightbox-counter');
        const hudTitleEl = document.getElementById('lightbox-hud-title');
        const zoomLevelEl = document.getElementById('lb-zoom-level');
        const zoomInBtn = document.getElementById('lb-zoom-in');
        const zoomOutBtn = document.getElementById('lb-zoom-out');
        const zoomResetBtn = document.getElementById('lb-zoom-reset');
        const closeTopBtn = document.getElementById('lb-close-top');

        let currentIndex = 0;
        let scale = 1;
        let panX = 0;
        let panY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let dragMoved = false;

        function extractCardMeta(card) {
            const img = card.querySelector('img');
            let captionText = card.getAttribute('data-title') || '';
            if (!captionText) {
                const screenName = card.querySelector('.screen-name, h4, .badge, .phone-tag');
                if (screenName) {
                    captionText = screenName.innerText.trim();
                } else if (img) {
                    captionText = img.getAttribute('alt') || 'UI Preview';
                }
            }
            return { src: img ? img.src : '', caption: captionText };
        }

        function applyTransform(smooth = true) {
            lightboxImg.style.transition = smooth ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
            lightboxImg.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
            lightboxImg.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in';
            if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
        }

        function resetZoom(smooth = true) {
            scale = 1;
            panX = 0;
            panY = 0;
            applyTransform(smooth);
        }

        function setZoom(newScale, smooth = true) {
            scale = Math.min(Math.max(newScale, 1), 3.5);
            if (scale === 1) {
                panX = 0;
                panY = 0;
            }
            applyTransform(smooth);
        }

        function openAt(index) {
            if (!zoomableCards.length) return;
            currentIndex = (index + zoomableCards.length) % zoomableCards.length;
            const meta = extractCardMeta(zoomableCards[currentIndex]);

            resetZoom(false);
            lightboxImg.src = meta.src;
            lightboxImg.alt = meta.caption;
            if (lightboxCaption) lightboxCaption.innerText = meta.caption;
            if (hudTitleEl) hudTitleEl.textContent = meta.caption;
            if (counterEl) {
                const num = String(currentIndex + 1).padStart(2, '0');
                const tot = String(zoomableCards.length).padStart(2, '0');
                counterEl.textContent = `[ SCREEN ${num} / ${tot} ]`;
            }

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            resetZoom(false);
        };

        zoomableCards.forEach((card, idx) => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                openAt(idx);
            });
        });

        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        if (closeTopBtn) closeTopBtn.addEventListener('click', closeLightbox);

        if (zoomInBtn) zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); setZoom(scale + 0.5); });
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); setZoom(scale - 0.5); });
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetZoom(true); });

        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); openAt(currentIndex - 1); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); openAt(currentIndex + 1); });

        // Click / Drag to Pan & Toggle Zoom on Image
        lightboxImg.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragMoved = false;
            if (scale > 1) {
                isDragging = true;
                startX = e.clientX - panX;
                startY = e.clientY - panY;
                applyTransform(false);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            dragMoved = true;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyTransform(false);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                applyTransform(true);
            }
        });

        lightboxImg.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dragMoved) {
                dragMoved = false;
                return;
            }
            if (scale === 1) {
                setZoom(2.0, true);
            } else {
                resetZoom(true);
            }
        });

        // Wheel Zoom inside Modal
        lightbox.addEventListener('wheel', (e) => {
            if (!lightbox.classList.contains('active')) return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.25 : -0.25;
            setZoom(scale + delta, false);
        }, { passive: false });

        // Backdrop click closes modal
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content-box')) {
                closeLightbox();
            }
        });

        // Keyboard navigation & zoom shortcuts
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowRight') openAt(currentIndex + 1);
            else if (e.key === 'ArrowLeft') openAt(currentIndex - 1);
            else if (e.key === '+' || e.key === '=') setZoom(scale + 0.5);
            else if (e.key === '-') setZoom(scale - 0.5);
            else if (e.key === '0') resetZoom(true);
        });
    }

    // Persist in-app navigation state when clicking any return or next case study links
    const navLinks = document.querySelectorAll('.nav-back-btn, a[href*="index.html"], .return-vertexx-btn, .project-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            try {
                sessionStorage.setItem('vertexx_in_app_nav', 'true');
                const audioEl = document.getElementById('case-bg-audio');
                if (audioEl && !audioEl.paused) {
                    localStorage.setItem('vertexx_audio_time', String(audioEl.currentTime));
                    localStorage.setItem('vertexx_audio_ts', String(Date.now()));
                }
            } catch (err) {}
        });
    });

    // Return to Vertexx Labs without refreshing
    const returnLinks = document.querySelectorAll('.nav-back-btn, a[href*="index.html#projects"], .return-vertexx-btn');
    returnLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            sessionStorage.setItem('vertexx_skip_loader', 'projects');
            sessionStorage.setItem('vertexx_in_app_nav', 'true');
            if (window.history.length > 1 && document.referrer && document.referrer.includes('index.html')) {
                e.preventDefault();
                window.history.back();
            }
        });
    });
});

// ============================================================
// PERSISTENT AUDIO ENGINE FOR CASE STUDIES
// ============================================================
function initCaseStudyAudio() {
    // If the user explicitly refreshed the case study page, reset audio to OFF
    try {
        const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        const navType = navEntry ? navEntry.type : (performance.navigation && performance.navigation.type === 1 ? 'reload' : 'navigate');
        sessionStorage.removeItem('vertexx_in_app_nav');
        if (navType === 'reload') {
            localStorage.setItem('vertexx_audio_enabled', 'false');
            localStorage.removeItem('vertexx_audio_time');
            localStorage.removeItem('vertexx_audio_ts');
        }
    } catch (e) {}

    let audioEl = document.getElementById('case-bg-audio');
    if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = 'case-bg-audio';
        audioEl.src = 'assets/suno_track.mp3';
        audioEl.loop = true;
        audioEl.preload = 'auto';
        audioEl.playsInline = true;
        audioEl.style.display = 'none';
        document.body.appendChild(audioEl);
    }
    // Match exact effective volume of AudioEngine on index.html (0.4 audioEl * 0.4 WebAudio GainNode = 0.16)
    audioEl.volume = 0.16;

    const toggleBtn = document.getElementById('case-audio-toggle');
    const labelEl = toggleBtn ? toggleBtn.querySelector('.case-audio-label') : null;
    let isRestoringTime = false;

    function getAudioEnabled() {
        try {
            return localStorage.getItem('vertexx_audio_enabled') === 'true';
        } catch (e) {
            return false;
        }
    }

    function setAudioEnabled(val) {
        try {
            localStorage.setItem('vertexx_audio_enabled', val ? 'true' : 'false');
        } catch (e) {}
    }

    function getSavedTargetTime() {
        try {
            const savedTime = parseFloat(localStorage.getItem('vertexx_audio_time'));
            const savedTs = parseInt(localStorage.getItem('vertexx_audio_ts') || '0', 10);
            if (!isNaN(savedTime) && savedTime > 0) {
                const elapsed = (savedTs > 0 && (Date.now() - savedTs) < 5000)
                    ? Math.min(Math.max((Date.now() - savedTs) / 1000, 0), 1.5)
                    : 0;
                return savedTime + elapsed;
            }
        } catch (e) {}
        return 0;
    }

    async function seekAndPlay() {
        const targetTime = getSavedTargetTime();
        if (targetTime > 0) {
            isRestoringTime = true;
            if (audioEl.readyState >= 1) {
                try {
                    const dur = audioEl.duration;
                    audioEl.currentTime = (dur && isFinite(dur)) ? (targetTime % dur) : targetTime;
                } catch (e) {}
                isRestoringTime = false;
            } else {
                await new Promise(resolve => {
                    const onMeta = () => {
                        try {
                            const dur = audioEl.duration;
                            audioEl.currentTime = (dur && isFinite(dur)) ? (targetTime % dur) : targetTime;
                        } catch (e) {}
                        isRestoringTime = false;
                        resolve();
                    };
                    audioEl.addEventListener('loadedmetadata', onMeta, { once: true });
                    setTimeout(() => {
                        isRestoringTime = false;
                        resolve();
                    }, 300);
                });
            }
        }
        try {
            await audioEl.play();
        } catch (err) {
            // Browser autoplay policy waiting for first gesture
        }
    }

    function updateUI(enabled) {
        if (!toggleBtn) return;
        if (enabled) {
            toggleBtn.classList.remove('muted');
            toggleBtn.classList.add('playing');
            if (labelEl) labelEl.textContent = '[ AUDIO: ON ]';
        } else {
            toggleBtn.classList.remove('playing');
            toggleBtn.classList.add('muted');
            if (labelEl) labelEl.textContent = '[ AUDIO: OFF ]';
        }
    }

    async function syncPlayback() {
        const enabled = getAudioEnabled();
        updateUI(enabled);
        if (enabled) {
            await seekAndPlay();
        } else {
            audioEl.pause();
        }
    }

    audioEl.addEventListener('timeupdate', () => {
        if (!audioEl.paused && !isRestoringTime && !audioEl.seeking) {
            try {
                localStorage.setItem('vertexx_audio_time', String(audioEl.currentTime));
                localStorage.setItem('vertexx_audio_ts', String(Date.now()));
            } catch (e) {}
        }
    });

    if (toggleBtn) {
        toggleBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const nextState = !getAudioEnabled();
            setAudioEnabled(nextState);
            updateUI(nextState);
            if (nextState) {
                await seekAndPlay();
            } else {
                audioEl.pause();
            }
        });
    }

    // Unlock audio on first user gesture if browser blocked initial autoplay
    function unlockOnGesture(e) {
        if (e && e.target && e.target.closest && e.target.closest('#case-audio-toggle')) return;
        if (getAudioEnabled() && audioEl.paused && !isRestoringTime) {
            seekAndPlay();
        }
    }
    ['click', 'scroll', 'wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlockOnGesture, { passive: true });
    });

    // Save playback position and pause when leaving page
    window.addEventListener('pagehide', () => {
        if (!audioEl.paused && !isRestoringTime) {
            try {
                localStorage.setItem('vertexx_audio_time', String(audioEl.currentTime));
                localStorage.setItem('vertexx_audio_ts', String(Date.now()));
            } catch (e) {}
        }
        audioEl.pause();
    });

    // Re-sync when restoring from bfcache
    window.addEventListener('pageshow', () => {
        syncPlayback();
    });

    // Initial playback sync
    syncPlayback();
}

// ============================================================
// 3D COSMIC STARFIELD ENGINE (Matching Vertexx Labs Space Theme)
// ============================================================
function initSpaceStarfield() {
    let canvas = document.getElementById('space-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'space-canvas';
        document.body.prepend(canvas);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const STAR_COUNT = 1600;
    const stars = [];
    const colors = ['#ffffff', '#ffffff', '#e6ffff', '#00ffff', '#80deea', '#ffffff'];

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: (Math.random() - 0.5) * width * 2.2,
            y: (Math.random() - 0.5) * height * 2.2,
            z: Math.random() * width + 1,
            size: Math.random() * 1.8 + 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: Math.random() * 0.8 + 0.2
        });
    }

    let speed = 0.8;
    let targetSpeed = 0.8;
    let mouseX = 0;
    let mouseY = 0;
    let lastScrollY = window.scrollY;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - width / 2) * 0.05;
        mouseY = (e.clientY - height / 2) * 0.05;
    });

    window.addEventListener('scroll', () => {
        const delta = Math.abs(window.scrollY - lastScrollY);
        lastScrollY = window.scrollY;
        targetSpeed = Math.min(0.8 + delta * 0.15, 12.0);
    }, { passive: true });

    function renderStars() {
        speed += (targetSpeed - speed) * 0.08;
        targetSpeed += (0.8 - targetSpeed) * 0.04;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Subtle ambient cosmic cyan glow
        const cx = width / 2 + mouseX * 2;
        const cy = height / 2 + mouseY * 2;
        const aura = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.65);
        aura.addColorStop(0, 'rgba(0, 255, 255, 0.035)');
        aura.addColorStop(0.5, 'rgba(0, 120, 180, 0.015)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);

        const fov = 380;

        for (let i = 0; i < STAR_COUNT; i++) {
            const s = stars[i];
            s.z -= speed;

            if (s.z <= 0) {
                s.z = width;
                s.x = (Math.random() - 0.5) * width * 2.2;
                s.y = (Math.random() - 0.5) * height * 2.2;
            }

            const k = fov / s.z;
            const px = (s.x + mouseX) * k + width / 2;
            const py = (s.y + mouseY) * k + height / 2;

            if (px >= 0 && px <= width && py >= 0 && py <= height) {
                const sz = Math.max(0.6, (1 - s.z / width) * s.size * 2.2);
                const alpha = Math.min(1, (1 - s.z / width) * s.alpha * 1.5);

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = s.color;

                if (sz > 2.0 && s.color === '#00ffff') {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 8;
                }

                ctx.beginPath();
                ctx.arc(px, py, sz / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        requestAnimationFrame(renderStars);
    }

    renderStars();
}

// ============================================================
// LIVE INTERACTIVE SANDBOXES (ECOSTAY, COZY COMFORT, SKILLPRO)
// ============================================================
function initInteractiveSandboxes() {
    const shells = document.querySelectorAll('.interactive-sandbox-shell');
    if (!shells.length) return;

    shells.forEach(shell => {
        const vpFrame = shell.querySelector('.sandbox-viewport-frame');
        const vpBtns = shell.querySelectorAll('.sb-vp-btn');
        const modeBtns = shell.querySelectorAll('.sb-tab-btn');
        const modePanels = shell.querySelectorAll('.sb-mode-container');

        // Viewport size switcher (Desktop / Tablet / Mobile)
        vpBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                vpBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const vp = btn.getAttribute('data-vp');
                if (vpFrame) {
                    vpFrame.classList.remove('vp-tablet', 'vp-mobile');
                    if (vp === 'tablet') vpFrame.classList.add('vp-tablet');
                    if (vp === 'mobile') vpFrame.classList.add('vp-mobile');
                }
            });
        });

        // Mode switcher (Live Interactive App vs Component Code)
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetMode = btn.getAttribute('data-mode');
                modePanels.forEach(panel => {
                    const isMatch = panel.getAttribute('data-mode-panel') === targetMode;
                    panel.style.display = isMatch ? 'block' : 'none';
                    panel.classList.toggle('active', isMatch);
                });
            });
        });
    });

    initEcoStaySandbox();
    initCozyComfortSandbox();
    initSkillProSandbox();
}

// ------------------------------------------------------------
// 01 // ECOSTAY RETREAT SANDBOX CONTROLLER
// ------------------------------------------------------------
function initEcoStaySandbox() {
    const shell = document.getElementById('ecostay-sandbox');
    if (!shell) return;

    const INITIAL_HABITATS = [
        { id: 'H-01', name: 'Aether Alpine Geo-Pod', category: 'GEO-POD', rate: 240, solarKwh: 18.5, badge: '99% OFF-GRID', elev: '2,100m Ridge', desc: 'Panoramic geodesic glass dome with passive solar thermal floor and stargazing skylight.' },
        { id: 'H-02', name: 'Solstice Glass Geo-Dome', category: 'GEO-POD', rate: 275, solarKwh: 21.0, badge: '100% SOLAR', elev: '2,240m Crest', desc: 'Private cliffside biosphere pod powered by dual-axis photovoltaic tracking arrays.' },
        { id: 'H-03', name: 'Whispering Pine Cedar Cabin', category: 'CEDAR CABIN', rate: 310, solarKwh: 24.0, badge: 'ZERO-WASTE', elev: '1,650m Forest', desc: 'Hand-milled reclaimed cedar sanctuary featuring closed-loop rainwater filtration.' },
        { id: 'H-04', name: 'Nordic Timber Sanctuary', category: 'CEDAR CABIN', rate: 340, solarKwh: 26.5, badge: 'RAINWATER LOOP', elev: '1,720m Valley', desc: 'Architectural cross-laminated timber cabin with wood-fired hot spring deck.' },
        { id: 'H-05', name: 'Cloudline Treetop Lodge', category: 'CANOPY LODGE', rate: 390, solarKwh: 31.0, badge: 'NET-POSITIVE', elev: '1,890m Canopy', desc: 'Suspended old-growth canopy suite connected via elevated rope sky-bridges.' },
        { id: 'H-06', name: 'Emerald Canopy Sky-Suite', category: 'CANOPY LODGE', rate: 420, solarKwh: 34.0, badge: 'CARBON NEGATIVE', elev: '1,950m Crown', desc: 'Flagship two-level botanical sanctuary generating 140% of its daily energy demand.' }
    ];

    let activeCategory = 'ALL';
    let stayNights = 3;
    let reservedIds = new Set(['H-01']);
    let expGuests = 2;
    let expDate = 'TOMORROW // DAWN';
    let calcTransportMult = 1.35;

    const gridEl = document.getElementById('eco-habitats-grid');
    const nightsValEl = document.getElementById('eco-nights-val');
    const countBadgeEl = document.getElementById('eco-count-badge');
    const reservedCountEl = document.getElementById('eco-reserved-count');
    const headerOffsetEl = document.getElementById('eco-header-offset');
    const toastEl = document.getElementById('eco-sandbox-toast');

    function setToast(msg) {
        if (toastEl) toastEl.textContent = `● ${msg}`;
    }

    // Sub-module switching (Habitats / Expeditions / Calculator)
    const modBtns = shell.querySelectorAll('[data-ecomod]');
    const modPanels = shell.querySelectorAll('[data-eco-panel]');
    modBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-ecomod');
            modPanels.forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-eco-panel') === target);
            });
            setToast(`SWITCHED MODULE // ACTIVE VIEW: ${target.toUpperCase()}`);
        });
    });

    function renderHabitats() {
        if (!gridEl) return;
        const filtered = INITIAL_HABITATS.filter(h => activeCategory === 'ALL' || h.category === activeCategory);
        if (countBadgeEl) countBadgeEl.textContent = `${filtered.length} UNITS`;
        if (nightsValEl) nightsValEl.textContent = `${stayNights} ${stayNights === 1 ? 'NIGHT' : 'NIGHTS'}`;
        if (reservedCountEl) reservedCountEl.textContent = String(reservedIds.size);

        let totalReservedCo2 = 0;
        INITIAL_HABITATS.forEach(h => {
            if (reservedIds.has(h.id)) {
                totalReservedCo2 += Math.round(h.solarKwh * stayNights * 0.82);
            }
        });
        if (headerOffsetEl) headerOffsetEl.textContent = `${totalReservedCo2 || 42} kg CO₂`;

        gridEl.innerHTML = filtered.map(h => {
            const totalCost = h.rate * stayNights;
            const co2Saved = Math.round(h.solarKwh * stayNights * 0.82);
            const isRes = reservedIds.has(h.id);
            return `
                <article class="sb-app-card">
                    <div>
                        <div class="sb-card-top">
                            <span class="sb-card-tag">${h.category}</span>
                            <span class="sb-status-pill in-stock">${h.badge}</span>
                        </div>
                        <h4 class="sb-card-title">${h.name}</h4>
                        <p class="sb-card-desc">${h.desc}</p>
                    </div>
                    <div>
                        <div class="sb-card-metrics">
                            <span>⚡ ${Math.round(h.solarKwh * stayNights)} kWh Solar</span>
                            <span>•</span>
                            <span>🌱 -${co2Saved} kg CO₂</span>
                            <span>•</span>
                            <span>⛰ ${h.elev}</span>
                        </div>
                        <div class="sb-card-footer">
                            <div>
                                <div class="sb-price-tag">$${totalCost}</div>
                                <div class="sb-price-sub">$${h.rate}/night &times; ${stayNights}n</div>
                            </div>
                            <button type="button" class="sb-action-btn ${isRes ? 'reserved' : ''}" data-reserve-id="${h.id}">
                                ${isRes ? '[ &#10003; RESERVED ]' : '[ RESERVE HABITAT ]'}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        gridEl.querySelectorAll('[data-reserve-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-reserve-id');
                const hab = INITIAL_HABITATS.find(x => x.id === id);
                if (reservedIds.has(id)) {
                    reservedIds.delete(id);
                    setToast(`RELEASED RESERVATION // ${hab ? hab.name.toUpperCase() : id}`);
                } else {
                    reservedIds.add(id);
                    setToast(`CONFIRMED OFF-GRID RESERVATION // ${hab ? hab.name.toUpperCase() : id} (${stayNights} NIGHTS)`);
                }
                renderHabitats();
            });
        });
    }

    // Category filter chips
    const catChips = shell.querySelectorAll('#eco-category-chips .sb-chip');
    catChips.forEach(chip => {
        chip.addEventListener('click', () => {
            catChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.getAttribute('data-cat') || 'ALL';
            renderHabitats();
            setToast(`FILTERED HABITAT CATALOG // CATEGORY: ${activeCategory}`);
        });
    });

    // Nights stepper
    const minusBtn = document.getElementById('eco-nights-minus');
    const plusBtn = document.getElementById('eco-nights-plus');
    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            stayNights = Math.max(1, stayNights - 1);
            renderHabitats();
            setToast(`UPDATED STAY DURATION // ${stayNights} NIGHTS`);
        });
    }
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            stayNights = Math.min(14, stayNights + 1);
            renderHabitats();
            setToast(`UPDATED STAY DURATION // ${stayNights} NIGHTS`);
        });
    }

    // Expedition Pass Scheduler
    const expSelect = document.getElementById('eco-exp-select');
    const guestsValEl = document.getElementById('eco-guests-val');
    const passTitleEl = document.getElementById('eco-pass-title');
    const passDateEl = document.getElementById('eco-pass-date');
    const passWinEl = document.getElementById('eco-pass-window');
    const passElevEl = document.getElementById('eco-pass-elev');
    const passGuestsEl = document.getElementById('eco-pass-guests');
    const passTotalEl = document.getElementById('eco-pass-total');
    const passConfirmEl = document.getElementById('eco-pass-confirmation');
    const bookPassBtn = document.getElementById('eco-book-pass-btn');

    function updateExpeditionPreview() {
        if (!expSelect) return;
        const opt = expSelect.options[expSelect.selectedIndex];
        const price = parseInt(opt.getAttribute('data-price') || '65', 10);
        const timeWin = opt.getAttribute('data-time') || '';
        const elev = opt.getAttribute('data-elev') || '';
        const cleanTitle = opt.text.replace(/\s*\(\$\d+.*\)/, '');

        if (guestsValEl) guestsValEl.textContent = `${expGuests} ${expGuests === 1 ? 'GUEST' : 'GUESTS'}`;
        if (passTitleEl) passTitleEl.textContent = cleanTitle;
        if (passDateEl) passDateEl.textContent = expDate;
        if (passWinEl) passWinEl.textContent = timeWin;
        if (passElevEl) passElevEl.textContent = elev;
        if (passGuestsEl) passGuestsEl.textContent = `${expGuests} ${expGuests === 1 ? 'Guest' : 'Guests'}`;
        if (passTotalEl) passTotalEl.textContent = `$${price * expGuests}`;
    }

    if (expSelect) {
        expSelect.addEventListener('change', () => {
            if (passConfirmEl) passConfirmEl.style.display = 'none';
            updateExpeditionPreview();
            setToast('UPDATED EXPEDITION TRAIL SELECTION');
        });
    }

    shell.querySelectorAll('#eco-date-pills .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            shell.querySelectorAll('#eco-date-pills .sb-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            expDate = chip.getAttribute('data-date') || 'TOMORROW // DAWN';
            if (passConfirmEl) passConfirmEl.style.display = 'none';
            updateExpeditionPreview();
        });
    });

    shell.querySelectorAll('#eco-gear-pills .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            const gear = chip.getAttribute('data-gear') || '';
            chip.innerHTML = `${chip.classList.contains('active') ? '&#10003;' : '+'} ${gear}`;
        });
    });

    const gMinus = document.getElementById('eco-guests-minus');
    const gPlus = document.getElementById('eco-guests-plus');
    if (gMinus) gMinus.addEventListener('click', () => { expGuests = Math.max(1, expGuests - 1); updateExpeditionPreview(); });
    if (gPlus) gPlus.addEventListener('click', () => { expGuests = Math.min(8, expGuests + 1); updateExpeditionPreview(); });

    if (bookPassBtn) {
        bookPassBtn.addEventListener('click', () => {
            const passId = 'EXP-' + Math.floor(1000 + Math.random() * 9000);
            if (passConfirmEl) {
                passConfirmEl.style.display = 'block';
                passConfirmEl.innerHTML = `&#10003; PASS DISPATCHED // ID: <strong>${passId}</strong> &bull; ${expGuests} GUESTS SCHEDULED FOR ${expDate}`;
            }
            setToast(`EXPEDITION PASS CONFIRMED // REF: ${passId}`);
        });
    }

    // Sustainability & Solar Impact Calculator
    const calcSlider = document.getElementById('eco-calc-nights');
    const calcNightsLbl = document.getElementById('eco-calc-nights-label');
    const metricCo2 = document.getElementById('eco-metric-co2');
    const metricSolar = document.getElementById('eco-metric-solar');
    const metricWater = document.getElementById('eco-metric-water');
    const barCo2 = document.getElementById('eco-bar-co2');
    const barSolar = document.getElementById('eco-bar-solar');
    const barWater = document.getElementById('eco-bar-water');

    function updateCalculator() {
        const n = calcSlider ? parseInt(calcSlider.value, 10) : 4;
        if (calcNightsLbl) calcNightsLbl.textContent = `${n} ${n === 1 ? 'NIGHT' : 'NIGHTS'}`;

        let pledgeBonus = 0;
        shell.querySelectorAll('#eco-pledge-chips .sb-chip.active').forEach(c => {
            pledgeBonus += parseInt(c.getAttribute('data-bonus') || '0', 10);
        });

        const co2 = Math.round((n * 16 * calcTransportMult) + pledgeBonus);
        const solar = Math.round(n * 18.5);
        const water = Math.round(n * 145 + (pledgeBonus * 2.5));

        if (metricCo2) metricCo2.textContent = `${co2} kg CO₂`;
        if (metricSolar) metricSolar.textContent = `${solar} kWh`;
        if (metricWater) metricWater.textContent = `${water} Liters`;

        if (barCo2) barCo2.style.width = `${Math.min(100, Math.round((co2 / 340) * 100))}%`;
        if (barSolar) barSolar.style.width = `${Math.min(100, Math.round((solar / 260) * 100))}%`;
        if (barWater) barWater.style.width = `${Math.min(100, Math.round((water / 1800) * 100))}%`;
    }

    if (calcSlider) {
        calcSlider.addEventListener('input', updateCalculator);
    }

    shell.querySelectorAll('#eco-transport-chips .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            shell.querySelectorAll('#eco-transport-chips .sb-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            calcTransportMult = parseFloat(chip.getAttribute('data-mult') || '1.0');
            updateCalculator();
            setToast('UPDATED TRANSPORT CARBON MULTIPLIER');
        });
    });

    shell.querySelectorAll('#eco-pledge-chips .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            const label = chip.textContent.replace(/^[\u2713+]\s*/, '');
            chip.innerHTML = `${chip.classList.contains('active') ? '&#10003;' : '+'} ${label}`;
            updateCalculator();
            setToast('UPDATED GUEST CONSERVATION PLEDGES');
        });
    });

    // Reboot button
    const resetBtn = shell.querySelector('[data-action="reset-sandbox"]');
    const bootOverlay = shell.querySelector('.sandbox-boot-overlay');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (bootOverlay) bootOverlay.classList.add('active');
            setTimeout(() => {
                activeCategory = 'ALL';
                stayNights = 3;
                reservedIds = new Set(['H-01']);
                expGuests = 2;
                calcTransportMult = 1.35;
                if (calcSlider) calcSlider.value = '4';
                catChips.forEach((c, idx) => c.classList.toggle('active', idx === 0));
                if (passConfirmEl) passConfirmEl.style.display = 'none';
                renderHabitats();
                updateExpeditionPreview();
                updateCalculator();
                if (bootOverlay) bootOverlay.classList.remove('active');
                setToast('SANDBOX REBOOTED // INITIAL STATE RESTORED');
            }, 420);
        });
    }

    renderHabitats();
    updateExpeditionPreview();
    updateCalculator();
}

// ------------------------------------------------------------
// 02 // COZY COMFORT DUAL-PORTAL SANDBOX CONTROLLER
// ------------------------------------------------------------
function initCozyComfortSandbox() {
    const shell = document.getElementById('cozy-sandbox');
    if (!shell) return;

    const DEFAULT_CATALOG = [
        { sku: 'CC-101', name: 'Nordic Merino Herringbone Throw', material: 'MERINO WOOL', price: 145, stock: 12, desc: '100% superfine Australian Merino wool woven in a breathable thermal herringbone pattern.' },
        { sku: 'CC-102', name: 'CloudWeave Deep-Sleep Weighted Blanket', material: 'WEIGHTED KNIT', price: 185, stock: 3, desc: 'Chunky hand-knitted 15lb therapeutic blanket with evenly distributed glass microbead core.' },
        { sku: 'CC-103', name: 'Organic Bamboo Cooling Comforter', material: 'ORGANIC BAMBOO', price: 160, stock: 9, desc: 'Silky 400-thread-count organic bamboo lyocell shell engineered for warm sleepers.' },
        { sku: 'CC-104', name: 'Alpine Sherpa Fleece Reserve Blanket', material: 'MERINO WOOL', price: 130, stock: 9, desc: 'Dual-sided brushed micro-sherpa and lofted wool blend for cabin-grade warmth.' }
    ];

    let catalog = DEFAULT_CATALOG.map(item => ({ ...item }));
    let cart = new Map([['CC-101', 1]]);
    let activeMaterial = 'ALL';
    let activeOpsStatus = 'ALL';
    let ordersDispatched = 0;

    const productsGrid = document.getElementById('cozy-products-grid');
    const cartListEl = document.getElementById('cozy-cart-list');
    const cartBadgeEl = document.getElementById('cozy-cart-badge');
    const lowStockBadgeEl = document.getElementById('cozy-lowstock-badge');
    const totalUnitsEl = document.getElementById('cozy-total-units');
    const ordersCountEl = document.getElementById('cozy-orders-count');
    const cartItemsCountEl = document.getElementById('cozy-cart-items-count');
    const subtotalEl = document.getElementById('cozy-subtotal');
    const shippingEl = document.getElementById('cozy-shipping');
    const totalEl = document.getElementById('cozy-total');
    const checkoutBtn = document.getElementById('cozy-checkout-btn');
    const orderFeedbackEl = document.getElementById('cozy-order-feedback');
    const warehouseTbody = document.getElementById('cozy-warehouse-tbody');
    const toastEl = document.getElementById('cozy-sandbox-toast');

    function setToast(msg) {
        if (toastEl) toastEl.textContent = `● ${msg}`;
    }

    function getStockMeta(stock) {
        if (stock <= 0) return { label: 'OUT OF STOCK', css: 'out-stock', key: 'LOW STOCK' };
        if (stock <= 4) return { label: `LOW STOCK (${stock} LEFT)`, css: 'low-stock', key: 'LOW STOCK' };
        return { label: `IN STOCK (${stock} UNITS)`, css: 'in-stock', key: 'IN STOCK' };
    }

    // Switch between Portal 01 (Storefront) and Portal 02 (Warehouse Console)
    const modBtns = shell.querySelectorAll('[data-cozymod]');
    const modPanels = shell.querySelectorAll('[data-cozy-panel]');
    modBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-cozymod');
            modPanels.forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-cozy-panel') === target);
            });
            setToast(`SWITCHED ACTIVE PORTAL // ${target.toUpperCase()} VIEW`);
        });
    });

    function syncAllViews() {
        // Compute telemetry totals
        let totalUnits = 0;
        let lowCount = 0;
        catalog.forEach(item => {
            totalUnits += item.stock;
            if (item.stock <= 4) lowCount += 1;
        });

        let totalCartItems = 0;
        cart.forEach(qty => { totalCartItems += qty; });

        if (cartBadgeEl) cartBadgeEl.textContent = `${totalCartItems} IN CART`;
        if (lowStockBadgeEl) lowStockBadgeEl.textContent = `${lowCount} LOW STOCK`;
        if (totalUnitsEl) totalUnitsEl.textContent = String(totalUnits);
        if (ordersCountEl) ordersCountEl.textContent = String(ordersDispatched);

        renderStorefront();
        renderCart();
        renderWarehouseTable();
    }

    function renderStorefront() {
        if (!productsGrid) return;
        const visible = catalog.filter(p => activeMaterial === 'ALL' || p.material === activeMaterial);

        productsGrid.innerHTML = visible.map(item => {
            const st = getStockMeta(item.stock);
            const inCartQty = cart.get(item.sku) || 0;
            const canAdd = item.stock > inCartQty;
            return `
                <article class="sb-app-card">
                    <div>
                        <div class="sb-card-top">
                            <span class="sb-card-tag">${item.sku} // ${item.material}</span>
                            <span class="sb-status-pill ${st.css}">${st.label}</span>
                        </div>
                        <h4 class="sb-card-title">${item.name}</h4>
                        <p class="sb-card-desc">${item.desc}</p>
                    </div>
                    <div class="sb-card-footer">
                        <div>
                            <div class="sb-price-tag">$${item.price}.00</div>
                            <div class="sb-price-sub">${inCartQty > 0 ? `${inCartQty} in cart` : 'Free Express Dispatch'}</div>
                        </div>
                        <button type="button" class="sb-action-btn" data-add-sku="${item.sku}" ${!canAdd ? 'disabled' : ''}>
                            ${item.stock <= 0 ? '[ SOLD OUT ]' : (!canAdd ? '[ MAX STOCK IN CART ]' : '[ + ADD TO CART ]')}
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        productsGrid.querySelectorAll('[data-add-sku]').forEach(btn => {
            btn.addEventListener('click', () => {
                const sku = btn.getAttribute('data-add-sku');
                const prod = catalog.find(p => p.sku === sku);
                if (!prod) return;
                const current = cart.get(sku) || 0;
                if (current < prod.stock) {
                    cart.set(sku, current + 1);
                    if (orderFeedbackEl) orderFeedbackEl.style.display = 'none';
                    syncAllViews();
                    setToast(`ADDED TO CART // ${prod.name.toUpperCase()} (QTY: ${current + 1})`);
                }
            });
        });
    }

    function renderCart() {
        if (!cartListEl) return;
        let subtotal = 0;
        let count = 0;
        const rows = [];

        cart.forEach((qty, sku) => {
            const prod = catalog.find(p => p.sku === sku);
            if (!prod || qty <= 0) return;
            count += qty;
            const lineTotal = prod.price * qty;
            subtotal += lineTotal;
            rows.push(`
                <div class="sb-cart-item">
                    <div>
                        <div class="sb-cart-item-title">${prod.name}</div>
                        <div class="sb-cart-item-meta">$${prod.price} &times; ${qty} = <strong>$${lineTotal}</strong></div>
                    </div>
                    <div class="sb-stepper">
                        <button type="button" class="sb-step-btn" data-cart-dec="${sku}">&minus;</button>
                        <span class="sb-step-val">${qty}</span>
                        <button type="button" class="sb-step-btn" data-cart-inc="${sku}">+</button>
                    </div>
                </div>
            `);
        });

        cartListEl.innerHTML = rows.length
            ? rows.join('')
            : `<div class="sb-validation-msg hint">Your cart is empty. Click [+ ADD TO CART] on any blanket card to test live checkout.</div>`;

        const shipping = subtotal > 0 ? (subtotal >= 250 ? 0 : 15) : 0;
        const total = subtotal + shipping;

        if (cartItemsCountEl) cartItemsCountEl.textContent = `${count} ${count === 1 ? 'ITEM' : 'ITEMS'}`;
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = shipping === 0 && subtotal > 0 ? 'FREE ($250+)' : `$${shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        if (checkoutBtn) checkoutBtn.disabled = count === 0;

        cartListEl.querySelectorAll('[data-cart-dec]').forEach(btn => {
            btn.addEventListener('click', () => {
                const sku = btn.getAttribute('data-cart-dec');
                const cur = cart.get(sku) || 0;
                if (cur <= 1) cart.delete(sku);
                else cart.set(sku, cur - 1);
                syncAllViews();
            });
        });

        cartListEl.querySelectorAll('[data-cart-inc]').forEach(btn => {
            btn.addEventListener('click', () => {
                const sku = btn.getAttribute('data-cart-inc');
                const prod = catalog.find(p => p.sku === sku);
                const cur = cart.get(sku) || 0;
                if (prod && cur < prod.stock) {
                    cart.set(sku, cur + 1);
                    syncAllViews();
                } else {
                    setToast(`WAREHOUSE LIMIT REACHED FOR ${sku} // SWITCH TO PORTAL 02 TO RESTOCK`);
                }
            });
        });
    }

    function renderWarehouseTable() {
        if (!warehouseTbody) return;
        const filtered = catalog.filter(item => {
            if (activeOpsStatus === 'ALL') return true;
            const st = getStockMeta(item.stock);
            return st.key === activeOpsStatus;
        });

        warehouseTbody.innerHTML = filtered.map(item => {
            const st = getStockMeta(item.stock);
            return `
                <tr>
                    <td><strong>${item.sku}</strong></td>
                    <td style="color:#ffffff; font-weight:600;">${item.name}</td>
                    <td>${item.material}</td>
                    <td>$${item.price}.00</td>
                    <td><strong style="color:#00ffff; font-size:0.9rem;">${item.stock} UNITS</strong></td>
                    <td><span class="sb-status-pill ${st.css}">${st.label}</span></td>
                    <td>
                        <div class="sb-stepper">
                            <button type="button" class="sb-step-btn" data-ops-delta="-1" data-ops-sku="${item.sku}">&minus;1</button>
                            <button type="button" class="sb-step-btn" data-ops-delta="1" data-ops-sku="${item.sku}">+1</button>
                            <button type="button" class="sb-step-btn" data-ops-delta="5" data-ops-sku="${item.sku}" style="width:auto; padding:0 8px;">+5</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        warehouseTbody.querySelectorAll('[data-ops-sku]').forEach(btn => {
            btn.addEventListener('click', () => {
                const sku = btn.getAttribute('data-ops-sku');
                const delta = parseInt(btn.getAttribute('data-ops-delta') || '0', 10);
                const prod = catalog.find(p => p.sku === sku);
                if (!prod) return;
                prod.stock = Math.max(0, prod.stock + delta);
                // Clamp cart quantity if warehouse stock dropped below cart
                if ((cart.get(sku) || 0) > prod.stock) {
                    if (prod.stock === 0) cart.delete(sku);
                    else cart.set(sku, prod.stock);
                }
                syncAllViews();
                setToast(`WAREHOUSE STOCK UPDATED // ${sku} NOW AT ${prod.stock} UNITS (SYNCED WITH STOREFRONT)`);
            });
        });
    }

    // Storefront collection filter chips
    shell.querySelectorAll('#cozy-material-chips .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            shell.querySelectorAll('#cozy-material-chips .sb-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeMaterial = chip.getAttribute('data-mat') || 'ALL';
            renderStorefront();
            setToast(`STOREFRONT FILTER // MATERIAL: ${activeMaterial}`);
        });
    });

    // Warehouse health filter chips
    shell.querySelectorAll('#cozy-ops-filter .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            shell.querySelectorAll('#cozy-ops-filter .sb-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeOpsStatus = chip.getAttribute('data-status') || 'ALL';
            renderWarehouseTable();
        });
    });

    // Restock All button in Warehouse Console
    const restockAllBtn = document.getElementById('cozy-restock-all-btn');
    if (restockAllBtn) {
        restockAllBtn.addEventListener('click', () => {
            catalog.forEach(item => { item.stock += 10; });
            syncAllViews();
            setToast('WAREHOUSE BATCH RESTOCK COMPLETE // +10 UNITS ADDED TO ALL SKUS');
        });
    }

    // Checkout button (decrements warehouse inventory in real time)
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            let unitsOrdered = 0;
            cart.forEach((qty, sku) => {
                const prod = catalog.find(p => p.sku === sku);
                if (prod) {
                    prod.stock = Math.max(0, prod.stock - qty);
                    unitsOrdered += qty;
                }
            });
            cart.clear();
            ordersDispatched += 1;
            const orderRef = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
            if (orderFeedbackEl) {
                orderFeedbackEl.style.display = 'block';
                orderFeedbackEl.innerHTML = `&#10003; ORDER <strong>${orderRef}</strong> CONFIRMED! ${unitsOrdered} unit(s) deducted from Distributor Warehouse.`;
            }
            syncAllViews();
            setToast(`ORDER ${orderRef} DISPATCHED // WAREHOUSE INVENTORY AUTOMATICALLY DEDUCTED`);
        });
    }

    // Reboot button
    const resetBtn = shell.querySelector('[data-action="reset-sandbox"]');
    const bootOverlay = shell.querySelector('.sandbox-boot-overlay');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (bootOverlay) bootOverlay.classList.add('active');
            setTimeout(() => {
                catalog = DEFAULT_CATALOG.map(item => ({ ...item }));
                cart = new Map([['CC-101', 1]]);
                activeMaterial = 'ALL';
                activeOpsStatus = 'ALL';
                ordersDispatched = 0;
                if (orderFeedbackEl) orderFeedbackEl.style.display = 'none';
                syncAllViews();
                if (bootOverlay) bootOverlay.classList.remove('active');
                setToast('DUAL-PORTAL SANDBOX REBOOTED // DEFAULT INVENTORY RESTORED');
            }, 420);
        });
    }

    syncAllViews();
}

// ------------------------------------------------------------
// 03 // SKILLPRO INSTITUTE SANDBOX CONTROLLER
// ------------------------------------------------------------
function initSkillProSandbox() {
    const shell = document.getElementById('skillpro-sandbox');
    if (!shell) return;

    const COURSES = [
        { code: 'SP-101', title: 'Full-Stack Cloud & UI Engineering', campus: 'COLOMBO', discipline: 'ICT & AI', level: 'NVQ LEVEL 5 DIPLOMA', duration: '12 Months', fee: 'LKR 68,000', seats: 6, desc: 'Modern React/Node architecture, cloud deployment, and accessible interface engineering.' },
        { code: 'SP-102', title: 'Industrial Robotics & PLC Mechatronics', campus: 'KANDY', discipline: 'MECHATRONICS', level: 'NVQ LEVEL 5 DIPLOMA', duration: '12 Months', fee: 'LKR 74,000', seats: 3, desc: 'Hands-on automated assembly line programming, pneumatic actuators, and sensor telemetry.' },
        { code: 'SP-103', title: 'Applied Cybersecurity & Network Defense', campus: 'COLOMBO', discipline: 'ICT & AI', level: 'NVQ LEVEL 4', duration: '6 Months', fee: 'LKR 52,000', seats: 9, desc: 'SOC operations, ethical penetration testing, and zero-trust enterprise firewall hardening.' },
        { code: 'SP-104', title: 'International Patisserie & Hospitality Mgmt', campus: 'MATARA', discipline: 'CULINARY & HOSPITALITY', level: 'CERTIFICATE', duration: '6 Months', fee: 'LKR 48,000', seats: 8, desc: 'Commercial kitchen workflows, artisan pastry arts, and luxury resort guest service standards.' },
        { code: 'SP-105', title: 'Renewable Solar Grid & Smart Automation', campus: 'KANDY', discipline: 'MECHATRONICS', level: 'NVQ LEVEL 4', duration: '8 Months', fee: 'LKR 58,000', seats: 4, desc: 'Photovoltaic micro-grid installation, inverter diagnostics, and IoT energy metering.' },
        { code: 'SP-106', title: 'Enterprise Data Analytics & Python AI', campus: 'MATARA', discipline: 'ICT & AI', level: 'NVQ LEVEL 5 DIPLOMA', duration: '10 Months', fee: 'LKR 64,000', seats: 11, desc: 'Predictive machine learning pipelines, SQL data warehousing, and executive BI dashboards.' }
    ];

    let searchQuery = '';
    let activeCampus = 'ALL';
    let activeDiscipline = 'ALL';
    let enrolledCount = 0;

    const coursesGrid = document.getElementById('skill-courses-grid');
    const searchInput = document.getElementById('skill-search-input');
    const matchBadge = document.getElementById('skill-match-badge');
    const enrolledCountEl = document.getElementById('skill-enrolled-count');
    const toastEl = document.getElementById('skill-sandbox-toast');

    function setToast(msg) {
        if (toastEl) toastEl.textContent = `● ${msg}`;
    }

    // View switching (Matrix vs Enrollment Form)
    const modBtns = shell.querySelectorAll('[data-skillmod]');
    const modPanels = shell.querySelectorAll('[data-skill-panel]');
    function switchSkillView(targetView) {
        modBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-skillmod') === targetView));
        modPanels.forEach(p => p.classList.toggle('active', p.getAttribute('data-skill-panel') === targetView));
    }

    modBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-skillmod');
            switchSkillView(target);
            setToast(`SWITCHED PORTAL VIEW // ${target.toUpperCase()}`);
        });
    });

    function renderCourseMatrix() {
        if (!coursesGrid) return;
        const q = searchQuery.trim().toLowerCase();
        const matched = COURSES.filter(c => {
            const matchQ = !q || c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.level.toLowerCase().includes(q);
            const matchC = activeCampus === 'ALL' || c.campus === activeCampus;
            const matchD = activeDiscipline === 'ALL' || c.discipline === activeDiscipline;
            return matchQ && matchC && matchD;
        });

        if (matchBadge) matchBadge.textContent = `${matched.length} ${matched.length === 1 ? 'PROGRAM' : 'PROGRAMS'}`;

        if (!matched.length) {
            coursesGrid.innerHTML = `
                <div class="sb-app-card" style="grid-column: 1 / -1; text-align:center; padding: 30px;">
                    <h4 class="sb-card-title">NO PROGRAMS MATCH CURRENT FILTER MATRIX</h4>
                    <p class="sb-card-desc">Try clearing the search query or selecting [ALL CAMPUSES] / [ALL FIELDS].</p>
                </div>
            `;
            return;
        }

        coursesGrid.innerHTML = matched.map(c => {
            const seatClass = c.seats <= 4 ? 'low-stock' : 'in-stock';
            return `
                <article class="sb-app-card">
                    <div>
                        <div class="sb-card-top">
                            <span class="sb-card-tag">${c.code} // ${c.campus}</span>
                            <span class="sb-status-pill ${seatClass}">${c.seats} SEATS OPEN</span>
                        </div>
                        <h4 class="sb-card-title">${c.title}</h4>
                        <p class="sb-card-desc">${c.desc}</p>
                    </div>
                    <div>
                        <div class="sb-card-metrics">
                            <span>🎓 ${c.level}</span>
                            <span>•</span>
                            <span>⏱ ${c.duration}</span>
                            <span>•</span>
                            <span>🏷 ${c.discipline}</span>
                        </div>
                        <div class="sb-card-footer">
                            <div>
                                <div class="sb-price-tag">${c.fee}</div>
                                <div class="sb-price-sub">Accredited Batch Intake</div>
                            </div>
                            <button type="button" class="sb-action-btn" data-enroll-code="${c.code}">
                                [ ENROLL IN BATCH &rarr; ]
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        coursesGrid.querySelectorAll('[data-enroll-code]').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-enroll-code');
                const courseSelect = document.getElementById('skill-select-course');
                if (courseSelect && code) {
                    courseSelect.value = code;
                }
                switchSkillView('enrollment');
                validateEnrollmentForm();
                setToast(`PRE-SELECTED PROGRAM ${code} // COMPLETE INLINE VALIDATION FORM TO ENROLL`);
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value || '';
            renderCourseMatrix();
        });
    }

    shell.querySelectorAll('#skill-campus-chips .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            shell.querySelectorAll('#skill-campus-chips .sb-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCampus = chip.getAttribute('data-campus') || 'ALL';
            renderCourseMatrix();
            setToast(`FILTERED COURSE MATRIX // CAMPUS: ${activeCampus}`);
        });
    });

    shell.querySelectorAll('#skill-disc-chips .sb-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            shell.querySelectorAll('#skill-disc-chips .sb-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeDiscipline = chip.getAttribute('data-disc') || 'ALL';
            renderCourseMatrix();
            setToast(`FILTERED COURSE MATRIX // DISCIPLINE: ${activeDiscipline}`);
        });
    });

    // Inline Validation Enrollment Form
    const nameInput = document.getElementById('skill-input-name');
    const nicInput = document.getElementById('skill-input-nic');
    const phoneInput = document.getElementById('skill-input-phone');
    const courseSelect = document.getElementById('skill-select-course');

    const msgName = document.getElementById('skill-msg-name');
    const msgNic = document.getElementById('skill-msg-nic');
    const msgPhone = document.getElementById('skill-msg-phone');

    const readinessPct = document.getElementById('skill-readiness-pct');
    const readinessBar = document.getElementById('skill-readiness-bar');
    const prevName = document.getElementById('skill-preview-name');
    const prevNic = document.getElementById('skill-preview-nic');
    const prevPhone = document.getElementById('skill-preview-phone');
    const prevCourse = document.getElementById('skill-preview-course');
    const submitBtn = document.getElementById('skill-submit-btn');
    const receiptBox = document.getElementById('skill-receipt-box');

    function setValidationMessage(el, state, text) {
        if (!el) return;
        el.className = `sb-validation-msg ${state}`;
        el.innerHTML = text;
    }

    function validateEnrollmentForm() {
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const nicVal = nicInput ? nicInput.value.trim() : '';
        const phoneVal = phoneInput ? phoneInput.value.trim() : '';
        const courseVal = courseSelect ? courseSelect.value : 'SP-101';

        // 1. Validate Full Name (at least 2 words or >= 4 chars)
        const nameValid = nameVal.length >= 4 && /^[a-zA-Z\s.'-]+$/.test(nameVal);
        if (!nameVal) {
            setValidationMessage(msgName, 'hint', 'Enter student full legal name as appearing on academic certificates.');
        } else if (nameValid) {
            setValidationMessage(msgName, 'valid', '&#10003; Verified full legal name format.');
        } else {
            setValidationMessage(msgName, 'invalid', '&#9888; Please enter at least 4 alphabetic characters without digits.');
        }

        // 2. Validate Sri Lankan NIC (9 digits + V/X or 12 digits)
        const isNewNic = /^[0-9]{12}$/.test(nicVal);
        const isOldNic = /^[0-9]{9}[vVxX]$/.test(nicVal);
        const nicValid = isNewNic || isOldNic;
        if (!nicVal) {
            setValidationMessage(msgNic, 'hint', 'Format guide: 12 digits (e.g. 200214501234) or 9 digits + V/X (e.g. 991234567V).');
        } else if (isNewNic) {
            setValidationMessage(msgNic, 'valid', '&#10003; Valid 12-digit modern Sri Lankan NIC detected.');
        } else if (isOldNic) {
            setValidationMessage(msgNic, 'valid', '&#10003; Valid 9-digit legacy Sri Lankan NIC detected.');
        } else {
            setValidationMessage(msgNic, 'invalid', '&#9888; Constructive hint: Check digit count (needs 12 digits or 9 digits ending in V/X).');
        }

        // 3. Validate Sri Lankan Mobile (07XXXXXXXX or +947XXXXXXXX)
        const phoneValid = /^(?:0|94|\+94)?7[0-9]{8}$/.test(phoneVal.replace(/[\s-]/g, ''));
        if (!phoneVal) {
            setValidationMessage(msgPhone, 'hint', 'Enter an active mobile number for SMS batch schedule alerts.');
        } else if (phoneValid) {
            setValidationMessage(msgPhone, 'valid', '&#10003; Valid Sri Lankan mobile carrier format.');
        } else {
            setValidationMessage(msgPhone, 'invalid', '&#9888; Format hint: Start with 07X (10 digits) or +947X (e.g. 0774589120).');
        }

        const validCount = (nameValid ? 1 : 0) + (nicValid ? 1 : 0) + (phoneValid ? 1 : 0);
        const pct = Math.round((validCount / 3) * 100);

        if (readinessPct) {
            readinessPct.textContent = `${pct}% READY`;
            readinessPct.style.color = pct === 100 ? '#00ff9d' : '#ffb703';
        }
        if (readinessBar) readinessBar.style.width = `${pct}%`;

        if (prevName) prevName.textContent = nameVal || '—';
        if (prevNic) {
            prevNic.textContent = nicVal ? `${nicVal} (${nicValid ? 'VALID' : 'CHECK FORMAT'})` : '—';
            prevNic.style.color = nicValid ? '#00ff9d' : '#ffb703';
        }
        if (prevPhone) prevPhone.textContent = phoneVal || '—';
        if (prevCourse) prevCourse.textContent = courseVal;
        if (submitBtn) submitBtn.disabled = pct < 100;

        return pct === 100;
    }

    [nameInput, nicInput, phoneInput, courseSelect].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                if (receiptBox) receiptBox.style.display = 'none';
                validateEnrollmentForm();
            });
            el.addEventListener('change', validateEnrollmentForm);
        }
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (!validateEnrollmentForm()) return;
            enrolledCount += 1;
            if (enrolledCountEl) enrolledCountEl.textContent = String(enrolledCount);
            const regId = 'SP-REG-' + Math.floor(1000 + Math.random() * 9000);
            const selectedCode = courseSelect ? courseSelect.value : 'SP-101';
            const courseObj = COURSES.find(c => c.code === selectedCode);
            if (courseObj && courseObj.seats > 1) {
                courseObj.seats -= 1;
                renderCourseMatrix();
            }
            if (receiptBox) {
                receiptBox.style.display = 'block';
                receiptBox.innerHTML = `&#10003; ENROLLMENT VERIFIED // REF: <strong>${regId}</strong> &bull; Seat reserved in <strong>${selectedCode}</strong> for ${nameInput.value.trim()}.`;
            }
            setToast(`STUDENT ENROLLMENT CONFIRMED // REF: ${regId} (${selectedCode})`);
        });
    }

    // Reboot button
    const resetBtn = shell.querySelector('[data-action="reset-sandbox"]');
    const bootOverlay = shell.querySelector('.sandbox-boot-overlay');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (bootOverlay) bootOverlay.classList.add('active');
            setTimeout(() => {
                searchQuery = '';
                activeCampus = 'ALL';
                activeDiscipline = 'ALL';
                if (searchInput) searchInput.value = '';
                shell.querySelectorAll('#skill-campus-chips .sb-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
                shell.querySelectorAll('#skill-disc-chips .sb-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
                if (nameInput) nameInput.value = 'Poorna Hasaranga';
                if (nicInput) nicInput.value = '200214501234';
                if (phoneInput) phoneInput.value = '0774589120';
                if (receiptBox) receiptBox.style.display = 'none';
                renderCourseMatrix();
                validateEnrollmentForm();
                if (bootOverlay) bootOverlay.classList.remove('active');
                setToast('SKILLPRO PORTAL SANDBOX REBOOTED // INITIAL STATE RESTORED');
            }, 420);
        });
    }

    renderCourseMatrix();
    validateEnrollmentForm();
}
