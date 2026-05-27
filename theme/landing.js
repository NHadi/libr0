/**
 * Animated Background for libr0 Landing Page
 * Memory-inspired particle network on dark background
 * Particles represent memory addresses flowing and connecting
 */

(function() {
    'use strict';

    function init() {
        const canvas = document.getElementById('memory-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        let mouseX = -1000;
        let mouseY = -1000;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }
        resize();

        // Particle system - memory nodes
        const particles = [];
        const PARTICLE_COUNT = Math.min(60, Math.floor(width * height / 20000));

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = 1.5 + Math.random() * 2.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = 0.15 + Math.random() * 0.35;
                this.pulseSpeed = 0.01 + Math.random() * 0.02;
                this.pulseOffset = Math.random() * Math.PI * 2;
                // Color variation: orange, blue, or purple tint
                const colorChoice = Math.random();
                if (colorChoice < 0.6) {
                    this.r = 206; this.g = 66; this.b = 43; // rust orange
                } else if (colorChoice < 0.8) {
                    this.r = 66; this.g = 153; this.b = 225; // blue
                } else {
                    this.r = 159; this.g = 122; this.b = 234; // purple
                }
            }

            update(time) {
                this.x += this.speedX;
                this.y += this.speedY;

                // Subtle mouse interaction
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.02;
                    this.x += dx * force;
                    this.y += dy * force;
                }

                // Wrap around
                if (this.x < -10) this.x = width + 10;
                if (this.x > width + 10) this.x = -10;
                if (this.y < -10) this.y = height + 10;
                if (this.y > height + 10) this.y = -10;

                // Pulse
                this.currentOpacity = this.opacity * (0.7 + 0.3 * Math.sin(time * this.pulseSpeed + this.pulseOffset));
            }

            draw() {
                ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.currentOpacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Subtle glow for larger particles
                if (this.size > 3) {
                    ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.currentOpacity * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Initialize particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        // Draw connections between nearby particles
        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 140) {
                        const opacity = (1 - distance / 140) * 0.06;
                        // Use the color of the first particle for the line
                        ctx.strokeStyle = `rgba(${particles[i].r}, ${particles[i].g}, ${particles[i].b}, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Floating memory address labels (subtle background text)
        const memLabels = [];
        const LABEL_COUNT = 8;

        class MemLabel {
            constructor() {
                this.reset();
                this.y = Math.random() * height;
            }

            reset() {
                this.x = Math.random() * width;
                this.y = -20;
                this.speed = 0.2 + Math.random() * 0.3;
                this.opacity = 0.03 + Math.random() * 0.04;
                this.text = '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
                this.size = 9 + Math.random() * 3;
            }

            update() {
                this.y += this.speed;
                if (this.y > height + 20) {
                    this.reset();
                }
            }

            draw() {
                ctx.font = `${this.size}px "JetBrains Mono", monospace`;
                ctx.fillStyle = `rgba(206, 66, 43, ${this.opacity})`;
                ctx.fillText(this.text, this.x, this.y);
            }
        }

        for (let i = 0; i < LABEL_COUNT; i++) {
            memLabels.push(new MemLabel());
        }

        // Animation loop
        let time = 0;
        function animate() {
            time++;
            ctx.clearRect(0, 0, width, height);

            // Draw memory labels (very subtle background)
            memLabels.forEach(label => {
                label.update();
                label.draw();
            });

            // Draw connections
            drawConnections();

            // Draw particles
            particles.forEach(p => {
                p.update(time);
                p.draw();
            });

            requestAnimationFrame(animate);
        }

        // Mouse tracking for subtle interaction
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            mouseX = -1000;
            mouseY = -1000;
        });

        window.addEventListener('resize', resize);
        animate();
    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
