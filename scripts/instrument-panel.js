/**
 * Antigravity Instrument Panel
 * Handles interactions for Start Engine, Scroll Speedometer, Horn, and Hazards.
 */

class InstrumentPanel {
    constructor() {
        this.state = {
            engineStarted: sessionStorage.getItem('engineStarted') === 'true',
            hazardsActive: false,
            scrollSpeed: 0,
            lastScrollTop: 0,
            lastScrollTime: Date.now(),
            headlightMode: 1 // 0=OFF, 1=LOW, 2=HIGH
        };

        this.elements = {
            root: null,
            startBtn: null,
            dashboard: null,
            speedBar: null,
            hornBtn: null,
            hazardSwitch: null,
            hazardOverlay: null,
            lightSwitch: null,
            nightScrim: null
        };

        this.audio = {
            start: new Audio('assets/sounds/engine-start.mp3'),
            horn: new Audio('assets/sounds/horn.mp3'),
            hornFunny: new Audio('assets/sounds/horn-funny.mp3'),
            blinker: new Audio('assets/sounds/blinker.mp3')
        };

        // Configure audio
        this.audio.blinker.loop = true;

        this.init();
    }

    init() {
        this.injectHTML();
        this.cacheElements();
        this.bindEvents();
        this.checkState();
        this.calculateDarkness();

        // Update darkness every minute
        setInterval(() => this.calculateDarkness(), 60000);
    }

    injectHTML() {
        const root = document.createElement('div');
        root.id = 'instrument-panel-root';
        root.innerHTML = `
            <button id="start-engine-btn" class="start-engine-btn">Start Engine</button>
            <div id="dashboard" class="dashboard">
                
                <!-- Horn -->
                <div class="instrument-group">
                    <button id="horn-btn" class="dash-btn instrument-bezel" aria-label="Honk Horn">
                        <svg class="horn-icon" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                    </button>
                    <div class="label">HORN</div>
                </div>

                <!-- Speedometer -->
                <div class="instrument-group main-gauge">
                    <div class="speedometer-dial instrument-bezel">
                        <div class="speedometer-ticks"></div>
                        <div class="speedometer-numbers">
                            <span>0</span>
                            <span>80</span>
                            <span>160</span>
                        </div>
                        <div id="speed-needle" class="speedometer-needle"></div>
                        <div class="speedometer-cap"></div>
                    </div>
                    <div class="label">MPH</div>
                </div>

                <!-- Hazards -->
                <div class="instrument-group">
                    <button id="hazard-switch" class="dash-btn instrument-bezel" role="switch" aria-checked="false" aria-label="Hazards">
                        <svg class="hazard-icon" viewBox="0 0 24 24">
                            <path d="M12 3l-9 18h18L12 3z" />
                            <path d="M12 9l-4.5 9h9L12 9z" />
                        </svg>
                    </button>
                    <div class="label">HAZARD</div>
                </div>

                <!-- Lights (Rotary Knob) -->
                <div class="instrument-group">
                    <div id="light-switch" class="light-knob-container" role="switch" aria-label="Lights">
                        <div class="knob-dial">
                            <div class="knob-pointer"></div>
                        </div>
                        <div class="knob-marker off"></div>
                        <div class="knob-marker low"></div>
                        <div class="knob-marker high"></div>
                    </div>
                    <div class="label">LIGHTS</div>
                </div>

            </div>
            <div id="hazard-overlay" class="hazard-overlay">
                <div class="hazard-light-left"></div>
                <div class="hazard-light-right"></div>
            </div>
            <div id="night-scrim" class="night-scrim"></div>
        `;
        document.body.appendChild(root);
    }

    cacheElements() {
        this.elements.root = document.getElementById('instrument-panel-root');
        this.elements.startBtn = document.getElementById('start-engine-btn');
        this.elements.dashboard = document.getElementById('dashboard');
        this.elements.needle = document.getElementById('speed-needle');
        this.elements.hornBtn = document.getElementById('horn-btn');
        this.elements.hazardSwitch = document.getElementById('hazard-switch');
        this.elements.hazardOverlay = document.getElementById('hazard-overlay');
        this.elements.lightSwitch = document.getElementById('light-switch');
        this.elements.nightScrim = document.getElementById('night-scrim');
    }

    bindEvents() {
        // Start Engine
        this.elements.startBtn.addEventListener('click', () => this.startEngine());

        // Horn
        this.elements.hornBtn.addEventListener('mousedown', () => this.honkHorn());
        this.elements.hornBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent duplicate mousedown
            this.honkHorn();
        });

        // Hazards
        this.elements.hazardSwitch.addEventListener('click', () => this.toggleHazards());

        // Lights
        this.elements.lightSwitch.addEventListener('click', () => this.toggleHeadlights());

        // Scroll Logic (Speedometer)
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

        // Decay idle speed
        setInterval(() => this.decaySpeed(), 100);
    }

    checkState() {
        if (this.state.engineStarted) {
            this.elements.startBtn.style.display = 'none';
            this.elements.dashboard.classList.add('active');
        }
    }

    startEngine() {
        this.state.engineStarted = true;
        sessionStorage.setItem('engineStarted', 'true');

        this.audio.start.play().catch(e => console.log('Audio play failed', e));

        this.elements.startBtn.classList.add('hidden');

        // Wait for button to fade out then slide up dashboard
        setTimeout(() => {
            this.elements.dashboard.classList.add('active');
            this.elements.startBtn.style.display = 'none';
        }, 600);
    }

    honkHorn() {
        // Giggle logic: 1 in 6 chance of funny sound
        const isFunny = Math.random() < (1 / 6);
        const sound = isFunny ? this.audio.hornFunny : this.audio.horn;

        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed', e));

        // Visual feedback
        this.elements.hornBtn.style.transform = 'scale(0.90)';
        setTimeout(() => this.elements.hornBtn.style.transform = '', 100);
    }

    toggleHeadlights() {
        this.state.headlightMode = (this.state.headlightMode + 1) % 3;
        this.updateHeadlightVisuals();
    }

    updateHeadlightVisuals() {
        const mode = this.state.headlightMode;
        // 0=OFF, 1=LOW, 2=HIGH

        // Rotate Knob
        // 0 (Off) -> -45deg
        // 1 (Low) -> 0deg
        // 2 (High) -> +45deg
        const rotation = (mode - 1) * 45;
        const knob = this.elements.lightSwitch.querySelector('.knob-dial');
        if (knob) knob.style.transform = `rotate(${rotation}deg)`;

        // Visual Feedback on Knob
        this.elements.lightSwitch.classList.toggle('active-low', mode === 1);
        this.elements.lightSwitch.classList.toggle('active-high', mode === 2);

        // Remove High Beam class
        document.body.classList.remove('high-beams');
        this.elements.nightScrim.classList.remove('headlights-mask');

        if (mode === 0) {
            // OFF: Scrim is just normal darkness
        } else if (mode === 1) {
            // LOW: Apply mask to scrim to reveal content
            this.elements.nightScrim.classList.add('headlights-mask');
        } else if (mode === 2) {
            // HIGH: Full brightness, remove scrim (or make transparent), add extreme filters
            document.body.classList.add('high-beams');
        }
    }

    calculateDarkness() {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        const decimalHour = hour + (minutes / 60);

        // Calculate Moon Phase (0 = New Moon, 0.5 = Full Moon, 1 = New Moon)
        const moon = this.getMoonPhase(now);
        // Darkness intensity: New Moon (1.0) -> Pitch Black. Full Moon (0.0) -> Visible.
        // We remap moon phase (0.5 is bright, 0/1 is dark)
        // Distance from Full Moon (0.5). 
        // 0 or 1 -> dist 0.5. 0.5 -> dist 0.
        // Darkness Factor = 0.5 + (dist * 0.8) -> 0.5 to 0.9.
        const distFromFull = Math.abs(moon - 0.5);
        const moonDarkness = 0.4 + (distFromFull * 1.0); // 0.4 (Full) to 0.9 (New)

        // Time Ramp
        // 6PM (18) -> Start darkening
        // 8PM (20) -> Max darkness
        // 6AM (6) -> Start lightening
        // 8AM (8) -> Full brightness

        let timeOpacity = 0;

        if (decimalHour >= 18 && decimalHour < 20) {
            // Sunset Ramp (0 -> 1)
            timeOpacity = (decimalHour - 18) / 2;
        } else if (decimalHour >= 20 || decimalHour < 6) {
            // Night (Max opacity)
            timeOpacity = 1;
        } else if (decimalHour >= 6 && decimalHour < 8) {
            // Sunrise Ramp (1 -> 0)
            timeOpacity = 1 - ((decimalHour - 6) / 2);
        } else {
            // Day
            timeOpacity = 0;
        }

        // Final opacity = timeOpacity * moonDarkness
        // ex: Night (1) * New Moon (0.9) = 0.9 opacity.
        // ex: Night (1) * Full Moon (0.4) = 0.4 opacity.
        const finalOpacity = timeOpacity * moonDarkness;

        this.elements.nightScrim.style.opacity = finalOpacity;

        // Dashboard Illumination: If it's getting dark, light up the dash
        if (finalOpacity > 0.2) {
            this.elements.dashboard.classList.add('night-illuminated');
        } else {
            this.elements.dashboard.classList.remove('night-illuminated');
        }

        // Also ensure headlight visuals are consistent with current mode
        this.updateHeadlightVisuals();
    }

    getMoonPhase(date) {
        // Standard algorithm to get approximate moon age (0..29.53)
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        if (month < 3) {
            year--;
            month += 12;
        }

        ++month;
        let c = 365.25 * year;
        let e = 30.6 * month;
        let jd = c + e + day - 694039.09; // jd is total days elapsed
        jd /= 29.5305882; // divide by moon cycle
        let b = parseInt(jd); // integer part
        jd -= b; // fractional part determines phase

        // 0 = New, 0.5 = Full, 1 = New
        return jd;
    }

    toggleHazards() {
        this.state.hazardsActive = !this.state.hazardsActive;
        const isActive = this.state.hazardsActive;

        this.elements.hazardSwitch.classList.toggle('active', isActive);
        this.elements.hazardSwitch.setAttribute('aria-checked', isActive);
        this.elements.hazardOverlay.classList.toggle('active', isActive);

        if (isActive) {
            this.audio.blinker.play().catch(e => console.log('Audio play failed', e));
            this.syncHazards();
        } else {
            this.audio.blinker.pause();
            this.audio.blinker.currentTime = 0;
            cancelAnimationFrame(this.state.hazardLoopLoc);
            // Reset opacity
            this.elements.hazardOverlay.style.opacity = '';
            document.querySelectorAll('.hazard-light-left, .hazard-light-right').forEach(el => el.style.opacity = '');
            const icon = this.elements.hazardSwitch.querySelector('.hazard-icon');
            if (icon) icon.style.opacity = '';
        }
    }

    syncHazards() {
        if (!this.state.hazardsActive) return;

        const time = this.audio.blinker.currentTime;
        const duration = 0.78; // Loop length
        const offset = 0.22;   // When the "click" happens
        const onDuration = 0.35; // How long it stays on (approx half loop)

        // Calculate position in the 0.78s loop
        const loopTime = time % duration;

        // Turn ON if we are past the offset but not too far past
        const isLightOn = loopTime >= offset && loopTime < (offset + onDuration);

        const opacity = isLightOn ? 1 : 0;

        // Apply directly to the light elements
        const lights = document.querySelectorAll('.hazard-light-left, .hazard-light-right');
        lights.forEach(el => el.style.opacity = opacity);

        // Sync the button icon as well
        const icon = this.elements.hazardSwitch.querySelector('.hazard-icon');
        if (icon) icon.style.opacity = isLightOn ? 1 : 0.3;

        this.state.hazardLoopLoc = requestAnimationFrame(() => this.syncHazards());
    }

    handleScroll() {
        if (!this.state.engineStarted) return;

        const now = Date.now();
        const scrollTop = window.scrollY;

        const deltaY = Math.abs(scrollTop - this.state.lastScrollTop);
        const deltaTime = now - this.state.lastScrollTime;

        if (deltaTime > 0) {
            // Pixels per millisecond
            const velocity = deltaY / deltaTime;
            // Normalize: Let's say 5px/ms is "Redline" (100%)
            const maxSpeed = 5;
            let percentage = Math.min((velocity / maxSpeed) * 100, 100);

            this.state.scrollSpeed = percentage;
            this.updateSpeedometer();
        }

        this.state.lastScrollTop = scrollTop;
        this.state.lastScrollTime = now;
    }

    decaySpeed() {
        if (this.state.scrollSpeed > 0) {
            this.state.scrollSpeed *= 0.8; // Decay factor
            if (this.state.scrollSpeed < 1) this.state.scrollSpeed = 0;
            this.updateSpeedometer();
        }
    }

    updateSpeedometer() {
        if (!this.elements.needle) return;

        // Map 0-100 to -120deg to +120deg
        const rotation = -120 + (this.state.scrollSpeed * 2.4);

        // Add random jitter if moving fast for realism
        const jitter = this.state.scrollSpeed > 20 ? (Math.random() - 0.5) * 3 : 0;

        this.elements.needle.style.transform = `rotate(${rotation + jitter}deg)`;

        // Redline shake
        if (this.state.scrollSpeed > 95) {
            this.elements.dashboard.classList.add('shaking-violent', 'motion-blur'); // Add blur to dashboard only
            this.elements.dashboard.classList.remove('shaking');
        } else if (this.state.scrollSpeed > 75) {
            this.elements.dashboard.classList.add('shaking');
            this.elements.dashboard.classList.remove('shaking-violent', 'motion-blur');
        } else {
            this.elements.dashboard.classList.remove('shaking', 'shaking-violent', 'motion-blur');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InstrumentPanel();
});
