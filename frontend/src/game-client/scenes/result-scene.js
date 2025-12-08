import { Container, Text } from 'pixi.js';

export class ResultScene {
  constructor(app, finalScores, playerId) {
    this.app = app;
    this.finalScores = finalScores;
    this.playerId = playerId;
    this.container = new Container();

    this.build();
  }

  build() {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // title
    const title = new Text({
      text: 'Game Over!',
      style: {
        fontSize: 48,
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    })
    title.anchor.set(0.5);
    title.x = screenWidth / 2;
    title.y = 100;
    this.container.addChild(title);

    // scores
    const sortedScores = Object.entries(this.finalScores)
      .sort((a, b) => b[1] - a[1]);

    let yPos = 200;
    sortedScores.forEach(([pid, score], index) => {
      const isCurrentPlayer = pid === this.playerId;
      const rank = index + 1;
      
      const scoreText = new Text({
        text: `${rank}. ${isCurrentPlayer ? 'YOU' : `Player ${pid.slice(0, 6)}`}: ${score} pts`,
        style: {
          fontSize: 28,
          fill: isCurrentPlayer ? '#f39c12' : '#ffffff',
          fontWeight: isCurrentPlayer ? 'bold' : 'normal'
        }
      })
      scoreText.anchor.set(0.5);
      scoreText.x = screenWidth / 2;
      scoreText.y = yPos;
      this.container.addChild(scoreText);

      yPos += 50;
    });
  }
}