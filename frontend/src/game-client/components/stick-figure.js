import { Graphics, Container, Text } from 'pixi.js';

export class StickFigure {
  constructor(x, y, color = 0xffffff, playerId = '', playerLabel = '') {
    this.container = new Container();
    this.container.x = x;
    this.container.y = y;
    this.color = color;
    this.playerId = playerId;
    this.playerLabel = playerLabel;
    this.isEliminated = false;
    
    this.build();
  }

  build() {
    this.graphics = new Graphics();
    this.drawStickFigure();
    this.container.addChild(this.graphics);
    
    // sign above players
    if (this.playerLabel) {
      const label = new Text({
        text: this.playerLabel,
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          fill: this.color,
          stroke: '#000000',
          strokeThickness: 2
        }
      });
      label.anchor.set(0.5);
      label.x = 0;
      label.y = -25; // above the head
      this.container.addChild(label);
    }
  }

  drawStickFigure() {
    const g = this.graphics;
    g.clear();
    
    // Head
    g.lineStyle(3, this.color);
    g.drawCircle(0, 0, 10);
    
    // Body
    g.moveTo(0, 10);
    g.lineTo(0, 35);
    g.stroke();
    
    // Arms
    g.moveTo(0, 20);
    g.lineTo(-12, 30);
    g.stroke();
    g.moveTo(0, 20);
    g.lineTo(12, 30);
    g.stroke();
    
    // Legs
    g.moveTo(0, 35);
    g.lineTo(-10, 55);
    g.stroke();
    g.moveTo(0, 35);
    g.lineTo(10, 55);
    g.stroke();
    
    console.log(`Drew stick figure with color ${this.color.toString(16)}`);
  }

  throwOff(screenWidth, screenHeight, onComplete) {
    if (this.isEliminated) return;
    
    this.isEliminated = true;
    const startX = this.container.x;
    const startY = this.container.y;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // trajectory math
      this.container.x = startX + (screenWidth - startX + 100) * progress;
      this.container.y = startY - 200 * Math.sin(progress * Math.PI) + 300 * progress;
      
      // rotate while falling
      this.container.rotation = progress * Math.PI * 2;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.visible = false;
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  // reset for next round
  reset(x, y) {
    this.isEliminated = false;
    this.container.x = x;
    this.container.y = y;
    this.container.rotation = 0;
    this.container.visible = true;
  }

  // celebrate for correct answer
  celebrate() {
    const startY = this.container.y;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // player jumps in joy
      this.container.y = startY - 30 * Math.sin(progress * Math.PI * 2);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.y = startY;
      }
    };
    
    animate();
  }
}