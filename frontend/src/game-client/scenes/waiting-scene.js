import { Container, Text } from 'pixi.js';

export class WaitingScene {
  constructor(app, message = 'Waiting for game to start...') {
    this.app = app;
    this.container = new Container();

    this._text = new Text(message, {
      fontSize: 32,
      fill: '#ffffff'
    });
    this._text.anchor.set(0.5);
    this._text.x = app.screen.width / 2;
    this._text.y = app.screen.height / 2;

    this.container.addChild(this._text);
  }

  destroy() {
    if (this._text && typeof this._text.destroy === 'function') {
      this._text.destroy({ texture: true, baseTexture: true });
      this._text = null;
    }
    if (this.container && typeof this.container.destroy === 'function') {
      this.container.destroy({ children: true });
      this.container = null;
    }
  }
}