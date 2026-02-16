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
            lastScrollTime: Date.now()
        };

        this.elements = {
            root: null,
            startBtn: null,
            dashboard: null,
            speedBar: null,
            hornBtn: null,
            hazardSwitch: null,
            hazardOverlay: null
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

            </div>
            <div id="hazard-overlay" class="hazard-overlay">
                <div class="hazard-light-left"></div>
                <div class="hazard-light-right"></div>
            </div>
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
