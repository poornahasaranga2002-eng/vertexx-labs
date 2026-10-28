// Vertexx Labs - Case Study Interactions, Space Starfield, Persistent Audio & Seamless Return Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Cosmic Starfield matching Vertexx Labs main page
    initSpaceStarfield();

    // Initialize Persistent Soundtrack across Case Studies & Main Site
    initCaseStudyAudio();

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
