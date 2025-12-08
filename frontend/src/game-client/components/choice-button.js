import { Graphics, Text, Container } from 'pixi.js';

export class ChoiceButton {
  constructor(text, x, y, width, height, onClick, backgroundColor = 0x3498db) {
    this.container = new Container();
    this.container.x = x;
    this.container.y = y;
    this.isSelected = false;
    this.isDisabled = false;
    this.onClick = onClick;
    this.backgroundColor = backgroundColor;
    this.width = width;
    this.height = height;

    // background
    this.bg = new Graphics();
    this.drawBackground(this.backgroundColor);
    this.container.addChild(this.bg);

    // text
    this.label = new Text({
      text: text,
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: width - 40,
        align: 'center'
      }
    })
    this.label.anchor.set(0.5);
    this.label.x = width / 2;
    this.label.y = height / 2;
    this.container.addChild(this.label);

    // make interactive
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.container.on('pointerover', () => {
      if (!this.isDisabled) {
        // Darken the color on hover
        this.drawBackground(this.darkenColor(this.backgroundColor));
      }
    });

    this.container.on('pointerout', () => {
      if (!this.isDisabled && !this.isSelected) {
        this.drawBackground(this.backgroundColor);
      }
    });

    this.container.on('pointerdown', () => {
      if (!this.isDisabled) {
        this.select();
        this.onClick();
      }
    });
  }

  darkenColor(color) {
    // darken hex color by reducing RGB values by 20%
    const r = ((color >> 16) & 0xFF) * 0.8;
    const g = ((color >> 8) & 0xFF) * 0.8;
    const b = (color & 0xFF) * 0.8;
    return (r << 16) | (g << 8) | b;
  }

  drawBackground(color) {
    this.bg.clear();
    this.bg.beginFill(color);
    this.bg.drawRoundedRect(0, 0, this.width, this.height, 15);
    this.bg.endFill();
  }

  select() {
    this.isSelected = true;
    // this.drawBackground(0x27ae60);
  }

  disable() {
    this.isDisabled = true;
    this.container.cursor = 'default';
  }

  showCorrect() {
    this.celebrate();
  }

  showIncorrect() {
  }

  celebrate() {
    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = new Graphics();
      const colors = [0xFFD700, 0xFFA500, 0xFF69B4, 0x00FF00, 0x00FFFF];
      particle.beginFill(colors[Math.floor(Math.random() * colors.length)]);
      particle.drawCircle(0, 0, 5);
      particle.endFill();
      
      particle.x = this.width / 2;
      particle.y = this.height / 2;
      
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 3 + Math.random() * 3;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 1.0;
      
      this.container.addChild(particle);
      particles.push(particle);
    }

    // animate celebration particles
    const animateParticles = () => {
      let allDead = true;
      
      particles.forEach(particle => {
        if (particle.life > 0) {
          allDead = false;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.2; // gravity
          particle.life -= 0.02;
          particle.alpha = particle.life;
          
          if (particle.life <= 0) {
            this.container.removeChild(particle);
          }
        }
      });
      
      if (!allDead) {
        requestAnimationFrame(animateParticles);
      }
    };
    
    animateParticles();

    // Button pulse animation
    const originalScale = 1;
    const duration = 300;
    const startTime = Date.now();

    const pulsate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = 1 + 0.1 * Math.sin(progress * Math.PI * 4);
      
      this.container.scale.set(scale);
      
      if (progress < 1) {
        requestAnimationFrame(pulsate);
      } else {
        this.container.scale.set(originalScale);
      }
    };
    
    pulsate();
  }
}