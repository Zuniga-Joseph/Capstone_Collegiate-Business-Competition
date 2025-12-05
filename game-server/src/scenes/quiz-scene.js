import { Container, Text, Graphics } from 'pixi.js';
import { ChoiceButton } from '../components/choice-button.js';
import { StickFigure } from '../components/stick-figure.js';

export class QuizScene {
  constructor(app, questionData, onAnswerCallback, players = [], currentPlayerId = null) {
    this.app = app;
    this.questionData = questionData;
    this.onAnswerCallback = onAnswerCallback;
    this.container = new Container();
    this.buttons = [];
    this.selectedChoice = null;
    this.playerIndicators = {};
    this.timerGraphics = null;
    this.timerText = null;
    this.currentTimer = 10;
    this.stickFigures = {};
    this.players = players;
    this.currentPlayerId = currentPlayerId;
    this.answerPeriodActive = false;

    this.build();
  }

  build() {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    // question text
    const questionText = new Text({
      text: this.questionData.question,
      style: {
        fontSize: 32,
        fill: '#ffffff',
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: screenWidth - 100,
        align: 'center'
      }
    });
    questionText.anchor.set(0.5, 0);
    questionText.x = screenWidth / 2;
    questionText.y = 50;
    this.container.addChild(questionText);

    this.createTimerIndicator(screenWidth, questionText.y);

    this.createStickFigures(screenWidth, screenHeight);

    const buttonColors = [
      0xE21B3C, // Red (top-left)
      0x1368CE, // Blue (top-right)
      0xD89E00, // Yellow (bottom-left)
      0x26890C  // Green (bottom-right)
    ];


    const buttonWidth = (screenWidth / 2) - 40; // Half screen minus spacing
    const buttonHeight = Math.min((screenHeight - 280) / 2 - 20, 150); // Constrain height
    const spacing = 20;
    const startY = 280; // Fixed position below stick figures

    const positions = [
      { x: spacing, y: startY }, // Top-left (0)
      { x: screenWidth / 2 + spacing / 2, y: startY }, // Top-right (1)
      { x: spacing, y: startY + buttonHeight + spacing }, // Bottom-left (2)
      { x: screenWidth / 2 + spacing / 2, y: startY + buttonHeight + spacing } // Bottom-right (3)
    ];

    this.questionData.choices.forEach((choice, index) => {
      const pos = positions[index];
      const color = buttonColors[index];
      
      const button = new ChoiceButton(
        choice,
        pos.x,
        pos.y,
        buttonWidth,
        buttonHeight,
        () => this.selectAnswer(index),
        color // Pass color to button
      );
      
      // hide at first
      button.container.visible = false;
      
      this.buttons.push(button);
      this.container.addChild(button.container);

      // Create container for player indicators on this choice
      const indicatorContainer = new Container();
      indicatorContainer.x = pos.x + buttonWidth / 2;
      indicatorContainer.y = pos.y + 20;
      this.container.addChild(indicatorContainer);
      this.playerIndicators[index] = { container: indicatorContainer, count: 0 };
    });

    // reveal choices w/ 10 sec delay
    this.revealChoices();
  }

  createTimerIndicator(screenWidth, questionY) {
    const timerContainer = new Container();
    timerContainer.x = screenWidth - 80;
    timerContainer.y = questionY + 10;

    const bgCircle = new Graphics();
    bgCircle.beginFill(0x2c3e50);
    bgCircle.drawCircle(0, 0, 35);
    bgCircle.endFill();
    timerContainer.addChild(bgCircle);

    this.timerGraphics = new Graphics();
    timerContainer.addChild(this.timerGraphics);

    this.timerText = new Text({
      text: '10',
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        fill: '#ffffff'
      }
    });
    this.timerText.anchor.set(0.5);
    timerContainer.addChild(this.timerText);

    this.container.addChild(timerContainer);
  }

  updateTimerDisplay(seconds) {
    this.currentTimer = seconds;
    this.timerText.text = seconds.toString();

    // draw progress circle
    this.timerGraphics.clear();
    const maxTime = this.answerPeriodActive ? 30 : 10;
    const progress = seconds / maxTime;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);

    // Change color to red when in answer period and time is running low
    const fillColor = this.answerPeriodActive && seconds <= 10 ? 0xe74c3c : 0x3498db;
    const lineColor = this.answerPeriodActive && seconds <= 10 ? 0xe74c3c : 0x3498db;

    this.timerGraphics.beginFill(fillColor, 0.3);
    this.timerGraphics.moveTo(0, 0);
    this.timerGraphics.arc(0, 0, 35, startAngle, endAngle);
    this.timerGraphics.lineTo(0, 0);
    this.timerGraphics.endFill();

    this.timerGraphics.lineStyle(3, lineColor);
    this.timerGraphics.arc(0, 0, 35, startAngle, endAngle);
  }

  revealChoices() {
    let revealedCount = 0;
    
    this.buttons.forEach((button, index) => {
      setTimeout(() => {
        button.container.visible = true;
        revealedCount++;
        
        // start timer for next button if there are more to reveal
        if (revealedCount < this.buttons.length) {
          this.startCountdown(10);
        }
      }, index * 10000);
    });

    // start initial countdown
    if (this.buttons.length > 0) {
      this.startCountdown(10);
    }
  }

  startAnswerPeriod() {
    this.answerPeriodActive = true;
    this.startCountdown(30);
    
    if (this.timerText) this.timerText.visible = true;
    if (this.timerGraphics) this.timerGraphics.visible = true;
  }

  startCountdown(duration) {
    this.currentTimer = duration;
    this.updateTimerDisplay(duration);

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      this.currentTimer--;
      if (this.currentTimer >= 0) {
        this.updateTimerDisplay(this.currentTimer);
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  createStickFigures(screenWidth, screenHeight) {
    // define colors for different players
    const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xF38181];
    const stageY = 180; // Fixed Y position higher up on screen
    
    // create a stage platform
    const platform = new Graphics();
    platform.beginFill(0x8B4513);
    platform.drawRect(50, stageY + 60, screenWidth - 100, 10);
    platform.endFill();
    this.container.addChild(platform);

    // space players out evenly
    const playerCount = this.players.length;
    
    if (playerCount === 0) {
      console.warn('No players to create stick figures for');
      return;
    }
    
    const spacing = (screenWidth - 200) / (playerCount + 1);

    this.players.forEach((playerId, index) => {
      const x = 100 + spacing * (index + 1);
      const y = stageY;
      const color = colors[index % colors.length];
      const label = playerId === this.currentPlayerId ? 'YOU' : `P${index + 1}`;
      
      console.log(`Creating stick figure for player ${playerId} at (${x}, ${y})`);
      
      const stickFigure = new StickFigure(x, y, color, playerId, label);
      this.stickFigures[playerId] = stickFigure;
      this.container.addChild(stickFigure.container);
      
      // store color for indicators
      this.playerColors = this.playerColors || {};
      this.playerColors[playerId] = color;
    });
    
    console.log('Total stick figures created:', Object.keys(this.stickFigures).length);
  }

  resetStickFigures() {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const stageY = 180;
    const playerCount = this.players.length;
    const spacing = (screenWidth - 200) / (playerCount + 1);

    this.players.forEach((playerId, index) => {
      const x = 100 + spacing * (index + 1);
      const y = stageY;
      
      if (this.stickFigures[playerId]) {
        this.stickFigures[playerId].reset(x, y);
      }
    });
  }

  selectAnswer(choiceIndex) {
    if (this.selectedChoice !== null) return; // already answered

    this.selectedChoice = choiceIndex;
    this.buttons[choiceIndex].select();
    
    // disable all buttons
    this.buttons.forEach(btn => btn.disable());

    // send to server
    this.onAnswerCallback(choiceIndex);
  }

  onPlayerAnswered(data) {
    // Show indicator that another player answered
    const choiceIndex = data.choiceIndex;
    const indicator = this.playerIndicators[choiceIndex];
    
    if (!indicator) return;

    const playerColor = this.playerColors && this.playerColors[data.playerId] 
      ? this.playerColors[data.playerId] 
      : 0x4CAF50;

    // create answer indicator circle w/ player color
    const circle = new Graphics();
    circle.beginFill(playerColor);
    circle.drawCircle(0, 0, 8);
    circle.endFill();
    
    // Position circles in a row
    const spacing = 20;
    circle.x = indicator.count * spacing;
    circle.y = 0;
    
    indicator.container.addChild(circle);
    indicator.count++;
    
    console.log(`Player ${data.playerId} answered choice ${choiceIndex}`);
  }

  showResults(results) {
    // clean up timer
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // show correct answer
    const correctIndex = this.questionData.correctAnswer;
    
    this.buttons.forEach((button, index) => {
      if (index === correctIndex) {
        button.showCorrect(); //show celebration effect
      }
      button.disable();
    });

    // animate figures based off results
    Object.keys(results.playerAnswers).forEach(playerId => {
      const playerAnswer = results.playerAnswers[playerId];
      const stickFigure = this.stickFigures[playerId];
      
      if (stickFigure) {
        if (playerAnswer.choice === correctIndex) {
          // correct answer, jump in joy
          stickFigure.celebrate();
        } else {
          // wrong answer, throw off stage
          stickFigure.throwOff(this.app.screen.width, this.app.screen.height);
        }
      }
    });

    // show score update
    const scoreText = new Text({
      text: `Score: ${results.scores[results.playerId]} (+${results.pointsEarned || 0})`,
      style: {
        fontSize: 24,
        fill: '#ffffff'
      }
    });
    scoreText.x = 20;
    scoreText.y = 20;
    this.container.addChild(scoreText);
  }

  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}