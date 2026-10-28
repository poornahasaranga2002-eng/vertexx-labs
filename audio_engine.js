/**
 * AudioEngine - Hybrid Audio Controller for Vertexx Labs
 * Combines HTML5 Audio element for instant, reliable autoplay and streaming,
 * with Web Audio API for cinematic lowpass filters and warp speed sync.
 */
export class AudioEngine {
    constructor(trackUrl, masterVolume = 0.4) {
        this.trackUrl = trackUrl;
        this.targetVolume = masterVolume;
        this.ctx = null;
        this.audioEl = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.filterNode = null;
        
        this.isPlaying = false;
        this.intensity = 0;
        this.fadeTimeline = null;
        this.isInitialized = false;
        this.isRestoringTime = false;
        
        // Internal state for Warp Sync
        this.baseFrequency = 20000;
        this.warpFrequency = 800;
        this.baseVolume = masterVolume;
        this.warpVolume = masterVolume * 1.5;
        this.currentWarpFactor = 0;
    }

    init() {
        if (this.isInitialized) return;

        // 1. Get or create background audio element
        let el = document.getElementById('bg-audio');
        if (!el) {
            el = document.createElement('audio');
            el.id = 'bg-audio';
            el.src = this.trackUrl;
            el.loop = true;
            el.preload = 'auto';
            el.playsInline = true;
            document.body.appendChild(el);
        }
        this.audioEl = el;
        this.audioEl.volume = this.targetVolume;

        // Persist playback position continuously (only when not mid-restore)
        this.audioEl.addEventListener('timeupdate', () => {
            if (this.isPlaying && !this.audioEl.paused && !this.isRestoringTime && !this.audioEl.seeking) {
                try {
                    localStorage.setItem('vertexx_audio_time', String(this.audioEl.currentTime));
                    localStorage.setItem('vertexx_audio_ts', String(Date.now()));
                } catch (e) {}
            }
        });

        // Save position & pause before navigating away so bfcache doesn't double-play
        window.addEventListener('pagehide', () => {
            if (this.audioEl) {
                if (!this.audioEl.paused && !this.isRestoringTime) {
                    try {
                        localStorage.setItem('vertexx_audio_time', String(this.audioEl.currentTime));
                        localStorage.setItem('vertexx_audio_ts', String(Date.now()));
                    } catch (e) {}
                }
                this.audioEl.pause();
            }
        });

        // 2. Setup Web Audio API routing for filter effects
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.gainNode = this.ctx.createGain();
                this.filterNode = this.ctx.createBiquadFilter();
                
                this.filterNode.type = 'lowpass';
                this.filterNode.frequency.value = this.baseFrequency;
                this.filterNode.Q.value = 1.0;
                
                this.gainNode.gain.value = this.targetVolume;
                
                this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);
                this.sourceNode.connect(this.filterNode);
                this.filterNode.connect(this.gainNode);
                this.gainNode.connect(this.ctx.destination);
            }
        } catch (e) {
            console.log("AudioEngine: Web Audio filter routing note:", e);
        }

        this.isInitialized = true;
    }

    getSavedTargetTime() {
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

    async play() {
        if (!this.isInitialized) {
            this.init();
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
            } catch (e) {}
        }

        if (!this.audioEl) return;

        // Capture saved time BEFORE starting playback so timeupdate at 0.0s never overwrites it
        const targetTime = this.getSavedTargetTime();
        if (targetTime > 0) {
            this.isRestoringTime = true;
            if (this.audioEl.readyState >= 1) {
                try {
                    const dur = this.audioEl.duration;
                    this.audioEl.currentTime = (dur && isFinite(dur)) ? (targetTime % dur) : targetTime;
                } catch (e) {}
                this.isRestoringTime = false;
            } else {
                await new Promise(resolve => {
                    const onMeta = () => {
                        try {
                            const dur = this.audioEl.duration;
                            this.audioEl.currentTime = (dur && isFinite(dur)) ? (targetTime % dur) : targetTime;
                        } catch (e) {}
                        this.isRestoringTime = false;
                        resolve();
                    };
                    this.audioEl.addEventListener('loadedmetadata', onMeta, { once: true });
                    setTimeout(() => {
                        this.isRestoringTime = false;
                        resolve();
                    }, 300);
                });
            }
        }

        try {
            const promise = this.audioEl.play();
            if (promise !== undefined) {
                await promise;
                this.isPlaying = true;
                this.intensity = 1;
                console.log("AudioEngine: Audio is playing.");
            }
        } catch (err) {
            console.log("AudioEngine: Autoplay waiting for interaction:", err);
            this.isPlaying = false;
        }

        // Smooth volume fade in if playing
        if (this.isPlaying) {
            if (this.fadeTimeline) this.fadeTimeline.kill();
            if (typeof gsap !== 'undefined') {
                this.fadeTimeline = gsap.to(this, {
                    intensity: 1,
                    duration: 1.0,
                    ease: "power2.out"
                });
            }
        }
    }

    stop() {
        if (!this.audioEl) return;
        this.isPlaying = false;
        
        if (this.fadeTimeline) this.fadeTimeline.kill();
        if (typeof gsap !== 'undefined') {
            this.fadeTimeline = gsap.to(this, {
                intensity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    if (!this.isPlaying && this.audioEl) {
                        this.audioEl.pause();
                    }
                }
            });
        } else {
            this.intensity = 0;
            this.audioEl.pause();
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    /**
     * Update audio parameters based on warp speed
     * @param {number} warp - Value from 0.0 to 1.0 (or higher)
     */
    updateWarp(warp) {
        if (!this.filterNode || !this.ctx) return;

        this.currentWarpFactor = Math.min(warp / 15.0, 1.0);
        
        // Filter frequency sweep
        const targetFreq = this.baseFrequency - (this.baseFrequency - this.warpFrequency) * this.currentWarpFactor;
        this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        
        if (this.gainNode) {
            const targetVol = (this.baseVolume + (this.warpVolume - this.baseVolume) * this.currentWarpFactor) * this.intensity;
            this.gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
        }
    }
}
