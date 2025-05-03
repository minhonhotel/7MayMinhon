export class SiriButton {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private centerX: number;
  private centerY: number;
  private radius: number;
  private ripples: Array<{
    radius: number;
    alpha: number;
    speed: number;
  }>;
  private isListening: boolean;
  private pulsePhase: number;
  private volumeLevel: number;
  private animationFrameId: number;
  private gradientRotation: number = 0;
  private isHovered: boolean = false;
  private isActive: boolean = false;
  private waveformPhase: number = 0;
  private particles: Array<{x: number, y: number, alpha: number, size: number, speed: number}> = [];
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isDarkMode: boolean = false;
  private elapsedTime: number = 0;
  private displayedTime: number = 0;
  private timeTarget: number = 60;
  private idleFrame: number = 0;
  private lastActiveTime: number = Date.now();
  private idleFlash: number = 0;

  constructor(containerId: string) {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container element not found');
    
    container.appendChild(this.canvas);
    
    // Get context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    // Initialize properties
    this.width = 200;
    this.height = 200;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = 40;
    this.ripples = [];
    this.isListening = false;
    this.pulsePhase = 0;
    this.volumeLevel = 0;
    this.animationFrameId = 0;

    // Set canvas size
    this.resize();

    // Start animation loop
    this.animate();

    // Add resize listener
    window.addEventListener('resize', this.resize.bind(this));

    // Add mouse event listeners for hover/active
    if (container) {
      container.addEventListener('mouseenter', () => { this.isHovered = true; this.lastActiveTime = Date.now(); });
      container.addEventListener('mouseleave', () => { this.isHovered = false; this.isActive = false; });
      container.addEventListener('mousedown', () => { this.isActive = true; this.lastActiveTime = Date.now(); });
      container.addEventListener('mouseup', () => { this.isActive = false; });
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.lastActiveTime = Date.now();
      });
    }

    // Detect dark mode
    this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.isDarkMode = e.matches;
    });
  }

  private resize() {
    // Get container size
    const container = this.canvas.parentElement;
    if (!container) return;

    // Set canvas size to be a perfect square (use min of width/height)
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(container.clientWidth, container.clientHeight);
    this.width = this.height = size;
    this.canvas.width = this.canvas.height = size * dpr;
    this.canvas.style.width = this.canvas.style.height = `${size}px`;
    // Ensure canvas is perfectly round
    this.canvas.style.borderRadius = '50%';
    this.canvas.style.overflow = 'hidden';
    // Scale context
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.scale(dpr, dpr);
    // Update center coordinates
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  private drawTexturePattern() {
    // Boutique subtle pattern: draw small gold dots in a grid
    const dotColor = 'rgba(232,181,84,0.18)';
    const step = 14;
    for (let x = -this.radius; x < this.radius; x += step) {
      for (let y = -this.radius; y < this.radius; y += step) {
        if (x * x + y * y < this.radius * this.radius * 0.85) {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(this.centerX + x, this.centerY + y, 1.2, 0, Math.PI * 2);
          this.ctx.fillStyle = dotColor;
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }
  }

  private drawLightBeam() {
    if (!(this.isHovered || this.isActive)) return;
    this.ctx.save();
    const grad = this.ctx.createLinearGradient(this.centerX, this.centerY - this.radius * 1.3, this.centerX, this.centerY + this.radius * 0.5);
    grad.addColorStop(0, 'rgba(255,255,255,0.22)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    this.ctx.beginPath();
    this.ctx.ellipse(this.centerX, this.centerY - this.radius * 0.7, this.radius * 0.7, this.radius * 0.22, 0, 0, 2 * Math.PI);
    this.ctx.fillStyle = grad;
    this.ctx.filter = 'blur(2.5px)';
    this.ctx.fill();
    this.ctx.filter = 'none';
    this.ctx.restore();
  }

  private drawBaseCircle() {
    // Parallax: offset center by mouse position (subtle)
    let offsetX = 0, offsetY = 0;
    if (this.isHovered) {
      offsetX = (this.mouseX - this.centerX) * 0.07;
      offsetY = (this.mouseY - this.centerY) * 0.07;
    }
    // Gradient rotation effect
    this.gradientRotation += 0.0025;
    const angle = this.gradientRotation % (2 * Math.PI);
    const gradX = this.centerX + Math.cos(angle) * this.radius * 1.2;
    const gradY = this.centerY + Math.sin(angle) * this.radius * 1.2;
    const outerGradient = this.ctx.createLinearGradient(
      this.centerX - this.radius * 1.2 + offsetX, this.centerY - this.radius * 1.2 + offsetY,
      gradX + offsetX, gradY + offsetY
    );
    outerGradient.addColorStop(0, this.isDarkMode ? '#1a237e' : '#2C4C83');
    outerGradient.addColorStop(1, this.isDarkMode ? '#3a4a6b' : '#5DB6B9');
    this.ctx.save();
    this.ctx.globalAlpha = 0.85;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX + offsetX, this.centerY + offsetY, this.radius * 1.25, 0, Math.PI * 2);
    this.ctx.strokeStyle = outerGradient;
    this.ctx.lineWidth = 12;
    this.ctx.shadowColor = this.isHovered ? '#E8B554' : '#E8B554';
    this.ctx.shadowBlur = this.isHovered ? 32 : 16;
    this.ctx.stroke();
    this.ctx.restore();

    // Glassmorphism effect
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.centerX + offsetX, this.centerY + offsetY, this.radius * 1.13, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isDarkMode ? 'rgba(40,50,80,0.18)' : 'rgba(255,255,255,0.10)';
    this.ctx.filter = 'blur(2.5px)';
    this.ctx.fill();
    this.ctx.filter = 'none';
    this.ctx.restore();

    // Inner gold circle
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.centerX + offsetX, this.centerY + offsetY, this.radius * 0.98, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isDarkMode ? '#bfa133' : '#E8B554';
    this.ctx.shadowColor = this.isDarkMode ? 'rgba(191,161,51,0.18)' : 'rgba(232,181,84,0.25)';
    this.ctx.shadowBlur = 10;
    this.ctx.fill();
    this.ctx.restore();

    // Boutique pattern/texture
    this.drawTexturePattern();

    // Neumorphism shadow
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.centerX + offsetX, this.centerY + offsetY, this.radius * 0.98, 0, Math.PI * 2);
    this.ctx.shadowColor = this.isDarkMode ? 'rgba(44,76,131,0.10)' : 'rgba(44,76,131,0.18)';
    this.ctx.shadowBlur = 24;
    this.ctx.globalAlpha = 0.7;
    this.ctx.strokeStyle = 'rgba(0,0,0,0)';
    this.ctx.lineWidth = 8;
    this.ctx.stroke();
    this.ctx.restore();

    // Light beam/flare
    this.drawLightBeam();

    // Draw modern mic icon in the center
    this.drawMicIcon(offsetX, offsetY);
  }

  private drawMicIcon(offsetX: number = 0, offsetY: number = 0) {
    let breath = 0.85 + 0.15 * Math.sin(this.pulsePhase * 1.5);
    if (this.isHovered) breath *= 1.08;
    if (this.isActive) breath *= 0.95;
    this.ctx.save();
    this.ctx.translate(this.centerX + offsetX, this.centerY + offsetY);
    this.ctx.scale(breath, breath);
    this.ctx.shadowColor = this.isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
    this.ctx.shadowBlur = 16 + 8 * breath + (this.isHovered ? 8 : 0);
    this.ctx.beginPath();
    this.ctx.moveTo(0, 18);
    this.ctx.arc(0, 0, 18, Math.PI * 0.15, Math.PI * 1.85, false);
    this.ctx.lineTo(0, 18);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255,255,255,0.92)';
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(-4, 18);
    this.ctx.lineTo(-4, 28);
    this.ctx.lineTo(4, 28);
    this.ctx.lineTo(4, 18);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255,255,255,0.92)';
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(0, 28, 6, 0, Math.PI, true);
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawRipples() {
    // Update and draw ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      ripple.radius += ripple.speed;
      ripple.alpha -= 0.01;

      if (ripple.alpha <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, ripple.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(63, 81, 181, ${ripple.alpha})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawPulsingRing() {
    // Draw pulsing ring when listening
    if (this.isListening) {
      const pulseRadius = this.radius + 10 + Math.sin(this.pulsePhase) * 5;
      const volumeBoost = this.volumeLevel * 20;
      
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, pulseRadius + volumeBoost, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      this.pulsePhase += 0.1;
    }
  }

  private drawWaveform() {
    if (!this.isListening) return;
    // Draw concentric waveform rings
    const rings = 4;
    this.waveformPhase += 0.08 + this.volumeLevel * 0.12;
    for (let i = 1; i <= rings; i++) {
      const baseRadius = this.radius * 0.98 + i * 10 + Math.sin(this.waveformPhase + i) * 3 * (1 + this.volumeLevel);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, baseRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(232,181,84,${0.18 + 0.08 * (rings-i)})`;
      this.ctx.lineWidth = 2 + this.volumeLevel * 2;
      this.ctx.shadowColor = '#E8B554';
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawParticles() {
    // Add new particles when listening
    if (this.isListening && Math.random() < 0.18) {
      const angle = Math.random() * 2 * Math.PI;
      const dist = this.radius * 1.18 + Math.random() * 16;
      this.particles.push({
        x: this.centerX + Math.cos(angle) * dist,
        y: this.centerY + Math.sin(angle) * dist,
        alpha: 0.7 + Math.random() * 0.3,
        size: 2 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.7
      });
    }
    // Draw and update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.alpha -= 0.012;
      p.size *= 0.98;
      p.y -= p.speed * 0.5;
      p.x += Math.sin(p.y * 0.1) * 0.2;
      if (p.alpha <= 0.05 || p.size < 0.5) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(232,181,84,${p.alpha})`;
      this.ctx.shadowColor = '#E8B554';
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawTimeRing() {
    // Draw thin progress ring around the button
    const percent = Math.min(1, this.elapsedTime / this.timeTarget);
    const color = percent < 0.5 ? '#E8B554' : percent < 1 ? '#d4af37' : '#e53935';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius * 1.32, -Math.PI/2, -Math.PI/2 + percent * 2 * Math.PI);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = percent > 0.95 ? 16 : 6;
    this.ctx.globalAlpha = 0.85;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawTimeText() {
    // Animate displayedTime for smooth counting
    this.displayedTime += (this.elapsedTime - this.displayedTime) * 0.18;
    const shown = Math.round(this.displayedTime);
    const min = Math.floor(shown / 60).toString().padStart(2, '0');
    const sec = (shown % 60).toString().padStart(2, '0');
    const timeStr = `${min}:${sec}`;
    this.ctx.save();
    this.ctx.font = '600 1.25rem Montserrat, Raleway, Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.shadowColor = 'rgba(44,76,131,0.22)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#fff';
    if (this.isDarkMode) this.ctx.fillStyle = '#e8e8e8';
    this.ctx.globalAlpha = 0.95;
    this.ctx.fillText(timeStr, this.centerX, this.centerY + this.radius * 1.45);
    this.ctx.restore();
  }

  private drawIdleFlash() {
    // Hiệu ứng nhấp nháy nhẹ khi không hoạt động lâu
    const idleMs = Date.now() - this.lastActiveTime;
    if (idleMs > 6000) {
      this.idleFlash += 0.08;
      const flash = 0.7 + 0.3 * Math.abs(Math.sin(this.idleFlash * 1.2));
      this.ctx.save();
      this.ctx.globalAlpha = 0.18 * flash;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, this.radius * 1.18, 0, Math.PI * 2);
      this.ctx.fillStyle = '#E8B554';
      this.ctx.filter = 'blur(2.5px)';
      this.ctx.fill();
      this.ctx.filter = 'none';
      this.ctx.restore();
    } else {
      this.idleFlash = 0;
    }
  }

  private drawVolumeVisualization() {
    // Visualization sóng âm động quanh nút khi listening
    if (!this.isListening) return;
    const bars = 16;
    const baseR = this.radius * 1.08;
    for (let i = 0; i < bars; i++) {
      const angle = (2 * Math.PI * i) / bars;
      const amp = 8 + Math.sin(this.waveformPhase + i) * 4 + this.volumeLevel * 18;
      const x1 = this.centerX + Math.cos(angle) * baseR;
      const y1 = this.centerY + Math.sin(angle) * baseR;
      const x2 = this.centerX + Math.cos(angle) * (baseR + amp);
      const y2 = this.centerY + Math.sin(angle) * (baseR + amp);
      this.ctx.save();
      this.ctx.strokeStyle = `rgba(232,181,84,${0.18 + 0.18 * this.volumeLevel})`;
      this.ctx.lineWidth = 2.2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.shadowColor = '#E8B554';
      this.ctx.shadowBlur = 6;
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private animate() {
    // Responsive: update radius based on container size
    const isMobile = Math.min(this.width, this.height) < 340;
    this.radius = isMobile ? Math.max(32, Math.min(this.width, this.height) / 2.8) : Math.max(36, Math.min(this.width, this.height) / 5.2);
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    // Draw all elements
    this.drawBaseCircle();
    this.drawWaveform();
    this.drawParticles();
    this.drawRipples();
    this.drawPulsingRing();
    this.drawTimeRing();
    this.drawTimeText();
    this.drawIdleFlash();
    this.drawVolumeVisualization();
    // Add new ripples when listening
    if (this.isListening && Math.random() < (isMobile ? 0.05 : 0.1)) {
      this.ripples.push({
        radius: this.radius,
        alpha: 0.4,
        speed: 1 + this.volumeLevel * 2
      });
    }
    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  public setListening(listening: boolean) {
    this.isListening = listening;
    if (listening) {
      // Reset ripples when starting to listen
      this.ripples = [];
    }
  }

  public setVolumeLevel(level: number) {
    // Clamp volume level between 0 and 1
    this.volumeLevel = Math.max(0, Math.min(1, level));
  }

  public setTime(seconds: number, target: number = 60) {
    this.elapsedTime = seconds;
    this.timeTarget = target;
  }

  public getTime() {
    return this.elapsedTime;
  }

  public cleanup() {
    // Remove event listeners and stop animation
    window.removeEventListener('resize', this.resize);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Remove canvas from DOM
    this.canvas.remove();
  }
} 