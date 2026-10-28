// Import Three.js via importmap defined in index.html
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioEngine } from './audio_engine.js?v=39';

// Initialize Audio Engine
const audioEngine = new AudioEngine('./assets/suno_track.mp3', 0.4);

// Detect browser refresh vs in-app navigation from a project page
(function initAudioSessionState() {
    try {
        const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        const navType = navEntry ? navEntry.type : (performance.navigation && performance.navigation.type === 1 ? 'reload' : 'navigate');
        const isInAppNav = sessionStorage.getItem('vertexx_in_app_nav') === 'true';
        sessionStorage.removeItem('vertexx_in_app_nav');

        // On page refresh or fresh visit (not returning from a project), reset audio to OFF
        if (navType === 'reload' || (!isInAppNav && navType !== 'back_forward')) {
            localStorage.setItem('vertexx_audio_enabled', 'false');
            localStorage.removeItem('vertexx_audio_time');
        }
    } catch (e) {}
})();

function getStoredAudioState() {
    try {
        return localStorage.getItem('vertexx_audio_enabled') === 'true';
    } catch (e) {
        return false;
    }
}

function setStoredAudioState(enabled) {
    window.isAudioEnabled = enabled;
    try {
        localStorage.setItem('vertexx_audio_enabled', enabled ? 'true' : 'false');
    } catch (e) {}
}

window.isAudioEnabled = getStoredAudioState();
window.audioEngine = audioEngine;

// Safe UI update function
function updateAudioUI() {
    const audioToggle = document.getElementById('audio-toggle');
    if (!audioToggle) return;
    const label = audioToggle.querySelector('.audio-label');
    if (window.isAudioEnabled) {
        audioToggle.classList.remove('muted');
        audioToggle.classList.add('playing');
        if (label) label.textContent = '[ AUDIO: ON ]';
    } else {
        audioToggle.classList.remove('playing');
        audioToggle.classList.add('muted');
        if (label) label.textContent = '[ AUDIO: OFF ]';
    }
}
window.updateAudioUI = updateAudioUI;

// Global safe audio trigger
async function tryStartAudio() {
    window.isAudioEnabled = getStoredAudioState();
    updateAudioUI();
    if (!window.isAudioEnabled) {
        audioEngine.stop();
        return;
    }
    try {
        audioEngine.init();
        await audioEngine.play();
        updateAudioUI();
    } catch (e) {
        console.log('Audio start note:', e);
    }
}
window.tryStartAudio = tryStartAudio;

// Initialize audio early & unlock on first gesture if browser blocked initial autoplay
audioEngine.init();
updateAudioUI();
tryStartAudio();

function unlockAudioOnInteraction(e) {
    if (e && e.target && e.target.closest && e.target.closest('#audio-toggle')) return;
    if (!window.isAudioEnabled) return;
    if (!audioEngine.isPlaying || (audioEngine.audioEl && audioEngine.audioEl.paused)) {
        tryStartAudio();
    }
}
['click', 'wheel', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudioOnInteraction, { passive: true });
});
document.getElementById('scroll-container')?.addEventListener('scroll', unlockAudioOnInteraction, { passive: true });

// --- FORCE SCROLL TO TOP ---
// Must reset the container, not window (body is overflow:hidden)
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

// Run after DOM is available
function resetScrollToTop() {
    const sc = document.getElementById('scroll-container');
    if (sc) sc.scrollTop = 0;
}

// --- SCRAMBLE TEXT UTILITY ---
function scrambleText(element, finalValue, duration = 1.0) {
    if (!element) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    const totalFrames = Math.max(1, Math.floor(duration * 60));
    let frame = 0;
    
    // Clear any existing timer on this element to prevent overlap
    if (element._scrambleTimer) clearInterval(element._scrambleTimer);

    element._scrambleTimer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        let currentText = '';
        for (let i = 0; i < finalValue.length; i++) {
            if (Math.random() < progress || finalValue[i] === ' ') {
                currentText += finalValue[i];
            } else {
                currentText += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        element.textContent = currentText;
        if (element.hasAttribute('data-text')) element.setAttribute('data-text', currentText);
        
        if (frame >= totalFrames) {
            element.textContent = finalValue;
            if (element.hasAttribute('data-text')) element.setAttribute('data-text', finalValue);
            clearInterval(element._scrambleTimer);
            delete element._scrambleTimer;
        }
    }, 1000 / 60);
}

// --- HERO DYNAMIC WORD CYCLE ---
function initHeroCycle() {
    const heroWord = document.getElementById('hero-word');
    if (!heroWord) return;
    const words = ['IMAGINE', 'ARCHITECT', 'DEPLOY'];
    let currentIndex = 0;
    setInterval(() => {
        currentIndex = (currentIndex + 1) % words.length;
        scrambleText(heroWord, words[currentIndex], 0.5);
    }, 3500);
}

// ============================================================
// THREE.JS SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 5;

// Global 3D viewport math
function getVisibleDimensions() {
    const vFOV = camera.fov * Math.PI / 180;
    const h = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const w = h * camera.aspect;
    return { w, h, targetX3D: w * 0.175 };
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.autoClearColor = false;
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- LIGHTING ---
const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
directionalLight.position.set(-5, 10, 5);
scene.add(directionalLight);

const rimLight = new THREE.PointLight(0x00FFFF, 50.0, 100);
rimLight.position.set(0, 0, -5);
scene.add(rimLight);

const chestLight = new THREE.PointLight(0x00FFFF, 2.0, 5);
scene.add(chestLight);

// --- DUST MOTES ---
const dustGeometry = new THREE.BufferGeometry();
const dustCount = 150;
const dustCoords = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount * 3; i++) dustCoords[i] = (Math.random() - 0.5) * 15;
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustCoords, 3));
const dustMaterial = new THREE.PointsMaterial({
    color: 0x00FFFF, size: 0.02, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
});
const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dustParticles);

// ============================================================
// GSAP PARAMS — all astronaut state driven here, read in animate()
// astronautZ starts at -30 so the glide-in scrub works correctly
// ============================================================
// Helper for dynamic mobile detection
const getIsMobile = () => window.innerWidth < 768;
const getMobileScaleMod = () => getIsMobile() ? 0.4 : 1.0;

const gsapParams = {
    astronautOpacity:   0,
    astronautScale:     0.018 * 0.6 * getMobileScaleMod(),
    astronautZ:         -30,
    astronautX:         0,
    astronautY:         -1.6,
    astronautRotationX: 0,
    astronautRotationY: 0,
    transitionWarp:     0,
    baseSpeedMultiplier: 1.0,
    pointingMode:       0,
    targetSectionSpeed: 0.15,
    isNavScrolling:     false
};

let currentActiveSectionId = 'home';

const ASTRONAUT_TWEEN_PROPS = 'astronautOpacity,astronautScale,astronautZ,astronautX,astronautY,astronautRotationX,astronautRotationY';

// --- SECTION ACTIVATION LOGIC (Module Scope) ---
function activateSection(id, force = false) {
    if (typeof gsap === 'undefined') return;
    if (id === 'hero') id = 'home';
    if (id === currentActiveSectionId && !force) return;

    const prevSectionId = currentActiveSectionId;
    currentActiveSectionId = id;

    const { w: visibleWidth, h: visibleHeight, targetX3D } = getVisibleDimensions();
    const sc = document.getElementById('scroll-container');
    const vh = sc ? (sc.clientHeight || window.innerHeight) : window.innerHeight;
    const scrollY = sc ? sc.scrollTop : 0;

    // Highlighting active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === `#${id}`) {
            gsap.to(link, { color: '#00FFFF', textShadow: '0 0 20px #00FFFF', duration: 0.3, overwrite: 'auto' });
        } else {
            gsap.to(link, { color: '#FFFFFF', textShadow: 'none', duration: 0.3, overwrite: 'auto' });
        }
    });

    // DOM Class Toggles
    document.querySelectorAll('.snap-section').forEach(sec => {
        if (sec.id === id) sec.classList.add('active');
        else sec.classList.remove('active');
    });

    if (id !== 'about') {
        document.querySelector('.about-content')?.classList.remove('reveal-active');
    }

    // Braking / Cruise Speed Mechanism
    if (id === 'about' || id === 'projects' || id === 'contact') {
        gsap.to(gsapParams, {
            targetSectionSpeed: 0.02,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
        });
    } else {
        gsap.to(gsapParams, {
            targetSectionSpeed: 0.15,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
        });
    }

    // Warp effect for transition (both scrolling down and scrolling back up to home)
    if (!gsapParams.isNavScrolling && prevSectionId !== id) {
        const warpPeak = id === 'home' ? 5.0 : 8.0;
        gsap.to(gsapParams, {
            transitionWarp: warpPeak,
            duration: 0.35,
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => {
                gsap.to(gsapParams, { transitionWarp: 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
            }
        });
    }

    if (id === 'home') {
        gsap.killTweensOf(gsapParams, ASTRONAUT_TWEEN_PROPS);
        if (scrollY >= vh * 0.98) {
            gsap.to(gsapParams, {
                astronautOpacity: 0,
                astronautZ: -30,
                duration: 0.6,
                ease: 'power2.inOut'
            });
        }
    } 
    else if (id === 'about') {
        const isMobile = getIsMobile();
        const mobileScaleMod = getMobileScaleMod();

        // If transitioning from Projects/Contact (or jumping directly), tween astronaut to About pose.
        // When scrolling between Home and About (scrollY < vh * 0.98), animate() scrubs gsapParams smoothly.
        if (scrollY >= vh * 0.98 || prevSectionId === 'projects' || prevSectionId === 'contact') {
            gsap.killTweensOf(gsapParams, ASTRONAUT_TWEEN_PROPS);
            gsap.to(gsapParams, {
                astronautOpacity: 1,
                astronautScale: 0.018 * 0.8 * mobileScaleMod,
                astronautZ: isMobile ? -2 : 0,
                astronautX: isMobile ? 0 : targetX3D,
                astronautY: isMobile ? visibleHeight * 0.3 : -1.6,
                astronautRotationY: isMobile ? 0 : -Math.PI / 4,
                duration: 0.9,
                ease: 'power2.out'
            });
        }

        // Re-trigger text scrambles visually within card
        const title = document.querySelector('.about-title');
        if (title) scrambleText(title, 'ABOUT', 1.2);
        document.querySelector('.about-content')?.classList.add('reveal-active');
    } 
    else if (id === 'projects') {
        gsap.killTweensOf(gsapParams, ASTRONAUT_TWEEN_PROPS);
        // Push astronaut to the far left and background to avoid overlapping the bento grid
        gsap.to(gsapParams, {
            astronautOpacity: 0.3, // More subtle
            astronautX: -targetX3D * 1.8, // Far left
            astronautZ: -10, // Back in the distance
            astronautRotationY: Math.PI / 4,
            duration: 1.2,
            ease: 'power2.out'
        });

        // Project cards flicker reveal
        document.querySelectorAll('.project-card').forEach((card, i) => {
            const ft = gsap.timeline({ delay: i * 0.15 });
            for (let j = 0; j < 6; j++) {
                ft.to(card, { opacity: Math.random() > 0.5 ? 0.8 : 0.1, duration: 0.05 });
            }
            ft.to(card, { opacity: 1, duration: 0.1, onStart: () => card.classList.add('reveal-active') });
        });
    } 
    else if (id === 'contact') {
        const isMobile = getIsMobile();
        const mobileScaleMod = getMobileScaleMod();

        gsap.killTweensOf(gsapParams, ASTRONAUT_TWEEN_PROPS);
        // Shifting astronaut slightly to the right to be closer to the terminal
        gsap.to(gsapParams, {
            astronautOpacity: 1,
            astronautScale: 0.018 * 1.2 * mobileScaleMod,
            astronautX: isMobile ? -visibleWidth * 0.42 : -targetX3D * 0.8,
            astronautY: isMobile ? -visibleHeight * 0.52 : -1.6,
            astronautZ: isMobile ? -2 : 1,
            astronautRotationY: Math.PI / 4,
            duration: 1.2,
            ease: 'power2.out'
        });
    }
}

// ============================================================
// INTERSECTION OBSERVER & UI INIT
// ============================================================
window.addEventListener('load', () => {
    if (typeof gsap === 'undefined') return;

    // Set initial active state for home
    activateSection('home', true);

    // --- NAV SMOOTH SCROLL ---
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = link.getAttribute('href').replace('#', '');
            const target = document.getElementById(id);
            if (target) {
                gsapParams.isNavScrolling = true;
                activateSection(id);

                // Trigger Warp Drive for navigation
                gsap.to(gsapParams, { 
                    transitionWarp: 15.0, 
                    duration: 0.4, 
                    ease: "power2.in",
                    overwrite: 'auto'
                });
                
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Once destination is reached, stop immediately
                let checks = 0;
                const checkDone = setInterval(() => {
                    checks++;
                    const sc = document.getElementById('scroll-container');
                    const targetTop = target.offsetTop;
                    if (!sc || Math.abs(sc.scrollTop - targetTop) < 8 || checks > 25) {
                         gsapParams.isNavScrolling = false;
                         gsap.to(gsapParams, { transitionWarp: 0, duration: 0.3, ease: "power2.out", overwrite: 'auto' });
                         clearInterval(checkDone);
                    }
                }, 100);
            }
        });
    });

    // Initialize IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        const sc = document.getElementById('scroll-container');
        const scrollY = sc ? sc.scrollTop : 0;
        const vh = sc ? (sc.clientHeight || window.innerHeight) : window.innerHeight;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (scrollY < vh * 0.45 && entry.target.id !== 'home' && entry.target.id !== 'hero') {
                    return;
                }
                activateSection(entry.target.id);
            }
        });
    }, { threshold: 0.55 });

    document.querySelectorAll('.snap-section').forEach(sec => observer.observe(sec));

    // --- 1. LIVE COLOMBO, SRI LANKA (GMT+5:30) TELEMETRY CLOCK ---
    const clockEl = document.getElementById('colombo-live-time');
    if (clockEl) {
        const updateColomboClock = () => {
            try {
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Asia/Colombo',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                clockEl.textContent = formatter.format(now);
            } catch (err) {
                clockEl.textContent = new Date().toLocaleTimeString();
            }
        };
        updateColomboClock();
        setInterval(updateColomboClock, 1000);
    }

    // --- 2. PROJECT CARD MOUSE-TRACKING NEON SPOTLIGHT GLOW ---
    const projectsGrid = document.querySelector('.projects-grid');
    const allProjectCards = document.querySelectorAll('.project-card');
    if (projectsGrid && allProjectCards.length) {
        projectsGrid.addEventListener('mousemove', (e) => {
            allProjectCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                card.style.setProperty('--spotlight-opacity', '1');
            });
        });
        projectsGrid.addEventListener('mouseleave', () => {
            allProjectCards.forEach(card => {
                card.style.setProperty('--spotlight-opacity', '0');
            });
        });
    }

    // --- 3. CONTACT TERMINAL ("INITIALIZE UPLINK") ---
    const uplinkBtn = document.getElementById('initialize-uplink-btn');
    if (uplinkBtn) {
        uplinkBtn.addEventListener('click', () => {
            const links = document.getElementById('social-links-container');
            const hudCard = uplinkBtn.closest('.contact-hud-card');
            const statusText = document.getElementById('uplink-status-text');
            const btnText = uplinkBtn.querySelector('.btn-text');

            const isNowRevealed = links ? links.classList.toggle('revealed') : true;
            uplinkBtn.classList.toggle('uplink-active', isNowRevealed);
            if (hudCard) hudCard.classList.toggle('uplink-established', isNowRevealed);

            if (isNowRevealed) {
                if (btnText) scrambleText(btnText, 'UPLINK ESTABLISHED', 0.6);
                if (statusText) scrambleText(statusText, 'SIGNAL: LOCKED // ONLINE', 0.5);
                if (links) {
                    const items = links.querySelectorAll('.social-link');
                    gsap.fromTo(items,
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out', overwrite: 'auto' }
                    );
                }
            } else {
                if (btnText) scrambleText(btnText, 'INITIALIZE UPLINK', 0.5);
                if (statusText) scrambleText(statusText, 'SIGNAL: STANDBY', 0.4);
            }
        });
    }

    // --- AUDIO CONTROL ---
    const audioToggle = document.getElementById('audio-toggle');
    updateAudioUI();
    tryStartAudio();

    if (audioToggle) {
        audioToggle.addEventListener('click', async (e) => {
            e.stopPropagation();
            setStoredAudioState(!window.isAudioEnabled);
            if (window.isAudioEnabled) {
                audioEngine.init();
                await audioEngine.play();
            } else {
                audioEngine.stop();
            }
            updateAudioUI();
        });
    }

    // --- DEEP DIVE OVERLAY LOGIC ---
    const projectCards = document.querySelectorAll('.project-card');
    const overlay = document.getElementById('project-overlay');
    const closeOverlayBtn = document.getElementById('close-overlay');
    
    if (overlay) {
        const overlayTitle = document.getElementById('overlay-title');
        const overlayTechStack = document.getElementById('overlay-tech-stack');
        const overlayDescription = document.getElementById('overlay-description');
        const overlayContent = document.querySelector('.overlay-content');
        
        // Use event delegation on the document body to catch all clicks reliably
        document.body.addEventListener('click', (e) => {
            // If user clicked directly on the direct case study link chip or overlay action button, persist audio state & timestamp
            const directLink = e.target.closest('.case-study-link-chip, #overlay-action-btn');
            if (directLink) {
                try {
                    sessionStorage.setItem('vertexx_in_app_nav', 'true');
                    if (audioEngine && audioEngine.audioEl && !audioEngine.audioEl.paused) {
                        localStorage.setItem('vertexx_audio_time', String(audioEngine.audioEl.currentTime));
                        localStorage.setItem('vertexx_audio_ts', String(Date.now()));
                    }
                } catch (err) {}
                return;
            }

            const card = e.target.closest('.project-card');
            if (card) {
                // Deep Dive Overlay Trigger
                // Populate data
                const title = card.getAttribute('data-title');
                const tech = card.getAttribute('data-tech');
                const desc = card.getAttribute('data-desc');
                const caseStudyUrl = card.getAttribute('data-case-study') || '#';
                
                if(title) {
                    overlayTitle.innerText = '';
                    scrambleText(overlayTitle, title, 1.0);
                }
                if(desc) overlayDescription.innerText = desc;
                
                // Update overlay case study link
                const actionBtn = document.getElementById('overlay-action-btn');
                if (actionBtn && caseStudyUrl) {
                    actionBtn.href = caseStudyUrl;
                }
                
                // Populate tech stack tags
                overlayTechStack.innerHTML = '';
                if(tech) {
                    const techList = tech.split(',');
                    techList.forEach(t => {
                        const span = document.createElement('span');
                        span.className = 'tech-tag';
                        span.innerText = t.trim();
                        overlayTechStack.appendChild(span);
                    });
                }
                
                // Show overlay
                overlay.style.visibility = 'visible';
                overlay.style.pointerEvents = 'auto';
                
                gsap.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.out' });
                gsap.to(overlayContent, { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.5)', delay: 0.1 });
            }
        });
        
        closeOverlayBtn.addEventListener('click', () => {
            gsap.to(overlayContent, { y: 30, opacity: 0, duration: 0.3, ease: 'power2.in' });
            gsap.to(overlay, { 
                opacity: 0, 
                duration: 0.4, 
                ease: 'power2.in', 
                delay: 0.1,
                onComplete: () => {
                    overlay.style.visibility = 'hidden';
                    overlay.style.pointerEvents = 'none';
                }
            });
        });
    }
});

// ============================================================
// ASTRONAUT MODEL LOADER
// ============================================================
let astronautModel = null;
window.scene = scene;
const mouse         = new THREE.Vector2();
const targetRotation = new THREE.Vector2();

window.addEventListener('mousemove', event => {
    mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/astronaut.glb', gltf => {
    const rawModel    = gltf.scene;
    astronautModel    = new THREE.Group();
    astronautModel.add(rawModel);

    const box    = new THREE.Box3().setFromObject(rawModel);
    const center = new THREE.Vector3();
    box.getCenter(center);

    rawModel.position.set(-center.x, -center.y, -center.z);
    rawModel.rotation.set(-Math.PI / 2, 0, 0);

    // Sync initial transform to gsapParams (astronautZ starts at -30)
    astronautModel.scale.setScalar(gsapParams.astronautScale);
    astronautModel.position.set(gsapParams.astronautX, -1.6, gsapParams.astronautZ);

    rawModel.traverse(child => {
        if (!child.isMesh || !child.material) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
            mat.transparent = true;
            mat.opacity     = 0;
            mat.side        = THREE.DoubleSide;
            mat.depthWrite  = true;

            const mn = (mat.name   || '').toLowerCase();
            const cn = (child.name || '').toLowerCase();

            if (mn.includes('visor') || mn.includes('glass') || mn.includes('helmet') ||
                mn.includes('lens')  || cn.includes('visor') || cn.includes('glass')) {
                mat.color.setHex(0x000000);
                mat.roughness = 0.1;
                mat.metalness = 1.0;
                mat.envMap    = texSharp;
                mat.envMapIntensity = 5.0;
                if (mn.includes('visor') || cn.includes('visor') || cn.includes('glass')) {
                    window.visorMaterial = mat;
                }
            } else if (mn.includes('light') || mn.includes('glow') || mn.includes('emissive') ||
                       mn.includes('cyan')  || cn.includes('light') || cn.includes('glow')) {
                mat.color.setHex(0x00FFFF);
                mat.emissive.setHex(0x00FFFF);
                mat.emissiveIntensity = 100.0;
                mat.metalness = 0.8;
                mat.roughness = 0.0;
            } else {
                mat.color.setHex(0xffffff);
                mat.roughness = 0.4;
                mat.metalness = 0.1;
            }
        });
    });

    scene.add(astronautModel);
    window.astronautModel = astronautModel;
}, undefined, err => console.error('GLB load error:', err));

// ============================================================
// TRAIL / FADE SETUP
// ============================================================
let currentOpacity   = 0;
const canvasContainer = document.getElementById('canvas-container');

const fadeScene    = new THREE.Scene();
const fadeCamera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fadeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 1.0, depthTest: false, depthWrite: false
});
fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial));

// ============================================================
// STARFIELD — depth-of-field layered shader stars
// ============================================================
function createStarTexture(sharpness) {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0,         'rgba(255,255,255,1)');
    g.addColorStop(sharpness, 'rgba(255,255,255,0.8)');
    g.addColorStop(1,         'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
}

const texSharp  = createStarTexture(0.8);
const texMedium = createStarTexture(0.3);
const texBlurry = createStarTexture(0.05);

const starVertexShader = `
  uniform float uSpeed;
  uniform float uStretch;
  uniform float uTime;
  uniform float uDensity;
  attribute float aSize;
  attribute float aIndex;
  varying float vOpacity;
  void main() {
    // Discard half the stars if density is reduced (mobile)
    if (uDensity < 0.7 && mod(aIndex, 2.0) > 0.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
    }

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Scale points down on mobile for thinner streaks
    float sizeMod = uDensity < 0.7 ? 0.5 : 1.0;
    gl_PointSize = aSize * sizeMod * (700.0 / -mvPosition.z);
    
    if (uSpeed > 10.0) gl_PointSize *= (1.0 + uSpeed * 0.02);
    gl_Position = projectionMatrix * mvPosition;
    vOpacity = 1.0;
  }
`;
const starFragmentShader = `
  uniform sampler2D uTexture;
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity) * texture2D(uTexture, gl_PointCoord);
  }
`;

const starLayers = [
    { count: 3500, size: 1.2, texture: texSharp,  opacity: 0.9 },
    { count: 1200, size: 3.5, texture: texMedium, opacity: 0.7 },
    { count:  400, size: 8.0, texture: texBlurry, opacity: 0.4 }
];

function setRandomSpherical(i, arr, rMin, rMax, centerZ = 0) {
    const r   = rMin + Math.random() * (rMax - rMin);
    const th  = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i*3]   = r * Math.sin(phi) * Math.cos(th);
    arr[i*3+1] = r * Math.sin(phi) * Math.sin(th);
    arr[i*3+2] = r * Math.cos(phi) + centerZ;
}

const starSystems = [];
starLayers.forEach(layer => {
    const geo   = new THREE.BufferGeometry();
    const pos     = new Float32Array(layer.count * 3);
    const sizes   = new Float32Array(layer.count);
    const indices = new Float32Array(layer.count);
    for (let i = 0; i < layer.count; i++) {
        setRandomSpherical(i, pos, 400, 1500, -500);
        sizes[i] = layer.size * (0.8 + Math.random() * 0.4);
        indices[i] = i;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aIndex',   new THREE.BufferAttribute(indices, 1));

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: layer.texture },
            uSpeed:   { value: 0 },
            uStretch: { value: 0.1 },
            uTime:    { value: 0 },
            uDensity: { value: 1.0 }
        },
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
    starSystems.push(points);
});

// ============================================================
// LOADING & BRAND CINEMATIC SEQUENCE
// ============================================================
let isLoading      = true;
let loadingProgress = 0;
let isIgnited      = false;

const progressBar    = document.getElementById('progress-bar');
const loadingOverlay = document.getElementById('loading-overlay');
const branding       = document.getElementById('branding');
const mainNav        = document.getElementById('main-nav');

// Instant direct reveal if returning to projects or with a section hash
const targetHash = window.location.hash;
const skipLoaderRequested = sessionStorage.getItem('vertexx_skip_loader') || (targetHash && targetHash !== '#home' && targetHash !== '');

if (skipLoaderRequested) {
    isLoading = false;
    loadingProgress = 100;
    isIgnited = true;
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        loadingOverlay.classList.add('fade-out');
    }
    if (branding) {
        branding.classList.add('assembling', 'flash-active', 'final-state');
    }
    document.getElementById('canvas-container')?.classList.add('stars-active');
    mainNav?.classList.add('nav-active');
    const audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) {
        audioBtn.classList.add('visible');
        if (typeof updateAudioUI === 'function') updateAudioUI();
    }
    document.body.classList.remove('no-scroll');
    const sc = document.getElementById('scroll-container');
    if (sc) {
        sc.style.overflowY = 'scroll';
    }
    
    const targetSection = (targetHash && targetHash.length > 1) ? targetHash.replace('#', '') : (sessionStorage.getItem('vertexx_skip_loader') || 'projects');
    sessionStorage.removeItem('vertexx_skip_loader');
    
    setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'start' });
            if (typeof activateSection === 'function') activateSection(targetSection);
        }
        if (typeof attachScrollListener === 'function') attachScrollListener();
    }, 60);
}

function updateLoading() {
    if (!isLoading) return;
    if (loadingProgress < 90) {
        loadingProgress += Math.random() * 2;
    } else {
        loadingProgress = 100;
        finishLoading();
    }
    if (progressBar) progressBar.style.width = `${loadingProgress}%`;
}

function finishLoading() {
    isLoading = false;

    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.classList.add('fade-out');

        setTimeout(() => {
            if (branding) branding.classList.add('assembling');

            setTimeout(() => {
                if (branding) branding.classList.add('flash-active');

                setTimeout(() => {
                    // Reveal starfield and UI
                    document.getElementById('canvas-container')?.classList.add('stars-active');
                    mainNav?.classList.add('nav-active');
                    const audioBtn = document.getElementById('audio-toggle');
                    if (audioBtn) {
                        audioBtn.classList.add('visible');
                        updateAudioUI();
                    }

                    // Unlock the SCROLL CONTAINER (body stays overflow:hidden)
                    document.body.classList.remove('no-scroll');
                    const sc = document.getElementById('scroll-container');
                    if (sc) {
                        sc.style.overflowY = 'scroll';
                        // Only force top if no section hash is specified
                        if (!window.location.hash || window.location.hash === '#home') {
                            sc.scrollTop = 0;
                        }
                    }

                    // Attach scroll listener now container is unlocked
                    attachScrollListener();

                    // Re-sync GSAP now scroll is active
                    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();

                    isIgnited = true;

                    setTimeout(() => {
                        if (branding) branding.classList.add('final-state');
                        initHeroCycle();
                        setTimeout(() => {
                            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                        }, 500);
                    }, 2500);

                }, 2000);
            }, 1500);
        }, 200);
    }, 100);
}

// ============================================================
// SCROLL WARP STATE
// Reads from #scroll-container.scrollTop
// ============================================================
let lastScrollTop     = 0;
let scrollVelocity    = 0;
let velocityTimeout   = null;
let currentZSpeed     = 0;
let wasIgnited        = false;
let scrollWarp        = 0;

function attachScrollListener() {
    const sc = document.getElementById('scroll-container');
    if (!sc || sc._scrollListenerAttached) return;
    sc._scrollListenerAttached = true;

    sc.addEventListener('scroll', () => {
        const scrollY = sc.scrollTop;
        const vh = sc.clientHeight || window.innerHeight;
        
        // Velocity calculation
        scrollVelocity = Math.abs(scrollY - lastScrollTop) * 0.1;
        lastScrollTop = scrollY;

        // Reset velocity when scroll stops
        if (velocityTimeout) clearTimeout(velocityTimeout);
        velocityTimeout = setTimeout(() => {
            scrollVelocity = 0;
        }, 100);

        // scrollWarp still used for hero logic if needed
        scrollWarp = Math.min(Math.max(scrollY / vh, 0), 1);

        // Real-time active section tracking (aligned with 0.5*vh midpoints)
        let detectedSection = 'home';
        if (scrollY < vh * 0.5) {
            detectedSection = 'home';
        } else if (scrollY < vh * 1.5) {
            detectedSection = 'about';
        } else if (scrollY < vh * 2.5) {
            detectedSection = 'projects';
        } else {
            detectedSection = 'contact';
        }

        if (detectedSection !== currentActiveSectionId) {
            activateSection(detectedSection);
        }
    }, { passive: true });
}

// ============================================================
// MAIN ANIMATION LOOP
// ============================================================
const clock = new THREE.Clock();

// Separate card Y float so it doesn't fight GSAP x/opacity tweens
let cardFloatY = 0;

// Dynamic Audio Visualizer Update
function updateVisualizer(time) {
    const bars = document.querySelectorAll('.bar');
    if (!bars.length || !audioEngine) return;
    
    // Use the intensity (0.0 to 1.0) from the Audio Engine (or active fallback when enabled)
    const intensity = window.isAudioEnabled ? (audioEngine.intensity || 0.8) : 0;
    
    bars.forEach((bar, i) => {
        // Base muted height (static-ish) vs. Active bouncing
        const minHeight = i % 2 === 0 ? 30 : 50; 
        const bounceAmount = (40 + i * 10) * intensity;
        const speed = (8 + i * 3) * intensity;
        
        // When intensity is 0, this results in the static muted heights defined in style_v19.css
        const bounce = Math.sin(time * speed) * bounceAmount;
        const finalHeight = minHeight + Math.abs(bounce);
        
        bar.style.height = `${finalHeight}%`;
    });
}

function animate() {
    requestAnimationFrame(animate);
    updateLoading();

    if (!isIgnited) {
        renderer.render(scene, camera);
        return;
    }

    if (!wasIgnited) {
        currentZSpeed = 0.15;
        wasIgnited    = true;
    }

    const time = clock.getElapsedTime();
    const maxWarpSpeed = 30.0;

    const sc = document.getElementById('scroll-container');
    const vh = sc ? (sc.clientHeight || window.innerHeight) : window.innerHeight;
    const scrollY = sc ? sc.scrollTop : 0;
    scrollWarp = Math.min(Math.max(scrollY / vh, 0), 1);

    // Starfield speed driven by scroll velocity + base speed
    // If we are at a target section, targetSectionSpeed drives the floor
    const targetSpeed = gsapParams.targetSectionSpeed + (scrollVelocity * 2.0);
    currentZSpeed += (targetSpeed - currentZSpeed) * 0.1;

    // Dampen if over max
    if (currentZSpeed > maxWarpSpeed) currentZSpeed = maxWarpSpeed;

    // --- LOGO EXIT & RE-ENTRY ANIMATION ---
    if (branding && branding.classList.contains('final-state')) {
        if (scrollWarp > 0.005) {
            const exitProgress = Math.min(scrollWarp / 0.35, 1);
            const scale = 1.0 + exitProgress * 1.5; // Smoothly scale 1.0 -> 2.5
            const opacity = Math.max(1.0 - exitProgress * 1.4, 0);
            branding.style.transform = `translate(-50%, -50%) scale(${scale})`;
            branding.style.opacity   = String(opacity);
            branding.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
        } else {
            branding.style.transform = 'translate(-50%, -50%) scale(1)';
            branding.style.opacity   = '1';
            branding.style.visibility = 'visible';
        }
    }

    // --- STARFIELD ---
    const activeSpeed = (currentZSpeed + (gsapParams.transitionWarp || 0)) * gsapParams.baseSpeedMultiplier;
    
    // Sync Audio Warp
    audioEngine.updateWarp(gsapParams.transitionWarp || 0);

    // Update Visualizer Bars
    updateVisualizer(time);

    // Fade effect based on speed (more speed = more dark trail)
    const speedFactor = Math.min(Math.max(activeSpeed / maxWarpSpeed, 0), 1);
    const targetFadeOpacity = 1.0 - (0.85 * speedFactor);
    fadeMaterial.opacity += (targetFadeOpacity - fadeMaterial.opacity) * 0.1;

    starSystems.forEach(system => {
        system.material.uniforms.uSpeed.value = activeSpeed;
        system.material.uniforms.uTime.value  = time;
        const arr   = system.geometry.attributes.position.array;
        const count = arr.length / 3;
        for (let i = 0; i < count; i++) {
            arr[i*3+2] += activeSpeed;
            if (arr[i*3+2] > 20) setRandomSpherical(i, arr, 400, 1200, -800);
        }
        system.geometry.attributes.position.needsUpdate = true;
    });

    // --- ASTRONAUT ---
    if (astronautModel) {
        // Continuous bidirectional scroll-scrub between Home (0) and About (vh)
        if (scrollY < vh * 0.98) {
            gsap.killTweensOf(gsapParams, ASTRONAUT_TWEEN_PROPS);
            const rawP = Math.min(Math.max((scrollY - vh * 0.12) / (vh * 0.83), 0), 1);
            const p = rawP * rawP * (3 - 2 * rawP); // Smoothstep 0 -> 1

            const isMobile = getIsMobile();
            const mobileScaleMod = getMobileScaleMod();
            const { h: visibleHeight, targetX3D } = getVisibleDimensions();
            const aboutZ = isMobile ? -2 : 0;
            const aboutX = isMobile ? 0 : targetX3D;
            const aboutY = isMobile ? visibleHeight * 0.3 : -1.6;
            const aboutRotY = isMobile ? 0 : -Math.PI / 4;
            const startScale = 0.018 * 0.5 * mobileScaleMod;
            const aboutScale = 0.018 * 0.8 * mobileScaleMod;

            gsapParams.astronautOpacity   = p;
            gsapParams.astronautZ         = -30 + (30 + aboutZ) * p;
            gsapParams.astronautX         = aboutX * p;
            gsapParams.astronautY         = aboutY;
            gsapParams.astronautScale     = startScale + (aboutScale - startScale) * p;
            gsapParams.astronautRotationY = aboutRotY * p;
        }

        const targetOpacity = gsapParams.astronautOpacity;
        const targetZ       = gsapParams.astronautZ;
        const targetScale   = gsapParams.astronautScale;
        const targetX       = gsapParams.astronautX;

        astronautModel.position.z = targetZ;
        astronautModel.position.x = targetX;
        astronautModel.scale.setScalar(targetScale);
        currentOpacity = targetOpacity;

        astronautModel.visible = targetOpacity > 0.01;
        if (!astronautModel.visible) {
            astronautModel.position.set(0, -9999, -9999);
            if (rimLight) rimLight.intensity = 0;
            if (chestLight) chestLight.intensity = 0;
            if (dustMaterial) dustMaterial.opacity = 0;
        } else {
            astronautModel.traverse(child => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => { mat.opacity = targetOpacity; });
                }
            });

            // Organic float
            const floatOffset = Math.sin(time * 1.2) * 0.06;
            const wobbleX     = Math.sin(time * 0.8) * 0.02;
            const wobbleY     = Math.cos(time * 0.7) * 0.02;
            const wobbleZ     = Math.sin(time * 1.5) * 0.02;

            astronautModel.position.y = gsapParams.astronautY + floatOffset;

            targetRotation.x = mouse.y * 0.08 * (1 - gsapParams.pointingMode) + gsapParams.astronautRotationX + wobbleX;
            targetRotation.y = mouse.x * 0.08 * (1 - gsapParams.pointingMode) + gsapParams.astronautRotationY + wobbleY;

            astronautModel.rotation.x += (targetRotation.x - astronautModel.rotation.x) * 0.1;
            astronautModel.rotation.y += (targetRotation.y - astronautModel.rotation.y) * 0.1;
            astronautModel.rotation.z += (wobbleZ          - astronautModel.rotation.z)  * 0.05;

            // Breathing lights
            const breathe        = (Math.sin(time * Math.PI * 0.5 - Math.PI / 2) + 1) / 2;
            const pulseIntensity = 0.8 + 0.5 * breathe;

            rimLight.intensity          = 50.0 * pulseIntensity * targetOpacity;
            chestLight.position.copy(astronautModel.position);
            chestLight.position.y      += 0.5;
            chestLight.intensity        = 2.0  * pulseIntensity * targetOpacity;

            // Card float — computed separately, applied via CSS not GSAP,
            // so it never conflicts with the x/opacity GSAP tweens
            cardFloatY = Math.cos(time * 1.1) * 6; // ±6px gentle bob
            const card = document.querySelector('.about-content');
            if (card) card.style.marginTop = `${cardFloatY}px`;

            // Dust drift
            dustParticles.rotation.y   += 0.001;
            dustParticles.position.y    = Math.sin(time * 0.5) * 0.2;
            dustMaterial.opacity        = targetOpacity * 0.4 * pulseIntensity;
        }
    }

    // Update star density uniform
    const density = getIsMobile() ? 0.5 : 1.0;
    starSystems.forEach(system => {
        if (system.material.uniforms.uDensity) {
            system.material.uniforms.uDensity.value = density;
        }
    });

    // Render the cinematic trail effect (fade to black over time)
    renderer.render(fadeScene, fadeCamera);
    
    // Render the main scene on top
    renderer.render(scene, camera);
}

animate();
resetScrollToTop();

// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Ensure bfcache restore keeps container scrollable and audio state synced
window.addEventListener('pageshow', (event) => {
    document.body.classList.remove('no-scroll');
    const sc = document.getElementById('scroll-container');
    if (sc) sc.style.overflowY = 'scroll';
    if (typeof attachScrollListener === 'function') attachScrollListener();
    window.isAudioEnabled = getStoredAudioState();
    const audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) {
        audioBtn.classList.add('visible');
    }
    updateAudioUI();
    if (window.isAudioEnabled) {
        tryStartAudio();
    } else {
        audioEngine.stop();
    }
});
