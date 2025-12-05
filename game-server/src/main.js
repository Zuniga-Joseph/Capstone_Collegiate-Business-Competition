import { Application } from 'pixi.js';
import { Game } from './game.js';

(async () => {
  const app = new Application();
  await app.init({
    background: '#2c3e50',
    resizeTo: window
  });

  document.body.appendChild(app.canvas);

  // start game
  const game = new Game(app);
  await game.start();
})();