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
    this.radius = 80;
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
  }

  private resize() {
    // Get container size
    const container = this.canvas.parentElement;
    if (!container) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    // Scale context
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transforms
    this.ctx.scale(dpr, dpr);
    
    // Update center coordinates
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = Math.min(this.width, this.height) / 2.5; // Đảm bảo luôn lớn hơn, tỷ lệ với container
  }

  private drawBaseCircle() {
    // Draw main circle
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1a237e'; // Dark blue base
    this.ctx.fill();

    // Add subtle gradient
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
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

  private animate() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw all elements
    this.drawBaseCircle();
    this.drawRipples();
    this.drawPulsingRing();

    // Add new ripples when listening
    if (this.isListening && Math.random() < 0.1) {
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