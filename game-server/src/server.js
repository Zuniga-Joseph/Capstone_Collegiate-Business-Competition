import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import {
  saveGameSession,
  saveGameResults,
  addParticipant
} from './services/database.js';
import { socketAuthMiddleware } from './services/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Add JWT authentication middleware
io.use(socketAuthMiddleware);

// serve static files
app.use(express.static(path.join(__dirname, '..')));

// game state, implement state machine
const gameState = {
  sessionId: null, // unique session ID for database
  sessionStartTime: null,
  players: {},
  currentQuestion: 0,
  answers: {},
  scores: {},
  gameStarted: false,
  roundTimer: null
};

// sample questions
const questions = [
  {
    question: "What is the capital of France?",
    choices: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    choices: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1
  },
  {
    question: "What is 2 + 2?",
    choices: ["3", "4", "5", "6"],
    correctAnswer: 1
  }
];

io.on('connection', async (socket) => {
  const userId = socket.userId; // Set by auth middleware
  console.log(`Player connected: ${socket.id} (User: ${userId})`);

  // add player with real user ID
  gameState.players[socket.id] = {
    id: socket.id,
    userId: userId,
    score: 0
  };
  gameState.scores[socket.id] = 0;

  // Add participant to current session if one exists
  if (gameState.sessionId) {
    try {
      await addParticipant(gameState.sessionId, userId);
    } catch (error) {
      console.error('Error adding participant to session:', error);
    }
  }

  // start game when we have at least 2 players (or after timeout)
  if (Object.keys(gameState.players).length >= 2 && !gameState.gameStarted) {
    startGame();
  }

  socket.on('submitAnswer', (data) => {
    const playerId = socket.id;
    const timestamp = Date.now();

    // store answer
    if (!gameState.answers[playerId]) {
      gameState.answers[playerId] = {
        choice: data.choiceIndex,
        timestamp: timestamp
      };

      // notify all players that someone answered
      io.emit('playerAnswered', { 
        playerId: playerId,
        choiceIndex: data.choiceIndex
      });

      // check if all players answered
      const allAnswered = Object.keys(gameState.players).every(
        pid => gameState.answers[pid]
      );

      if (allAnswered) {
        // clear the timer and process results immediately
        if (gameState.roundTimer) {
          clearTimeout(gameState.roundTimer);
          gameState.roundTimer = null;
        }
        processRoundResults();
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete gameState.players[socket.id];
    delete gameState.scores[socket.id];
    delete gameState.answers[socket.id];
  });
});

function startGame() {
  gameState.gameStarted = true;
  gameState.currentQuestion = 0;
  gameState.sessionId = uuidv4(); // generate unique session ID
  gameState.sessionStartTime = new Date().toISOString();

  console.log(`Starting game session: ${gameState.sessionId}`);

  io.emit('gameStart', {
    players: Object.keys(gameState.players),
    sessionId: gameState.sessionId
  });

  // send first question after a delay
  setTimeout(() => {
    sendNextQuestion();
  }, 2000);
}

function sendNextQuestion() {
  if (gameState.currentQuestion >= questions.length) {
    endGame();
    return;
  }

  const question = questions[gameState.currentQuestion];
  gameState.answers = {}; // reset answers

  io.emit('newQuestion', {
    questionNumber: gameState.currentQuestion + 1,
    totalQuestions: questions.length,
    question: question.question,
    choices: question.choices
  });

  // start 30-second timer after all choices are revealed (4 choices × 10 seconds = 40 seconds)
  const revealTime = 40000; // 40 seconds for all 4 choices to reveal
  const answerTime = 30000; // 30 seconds to answer
  
  setTimeout(() => {
    // notify clients that answer period has started
    io.emit('answerPeriodStart');
    
    // set timer to auto-process results after 30 seconds
    gameState.roundTimer = setTimeout(() => {
      processRoundResults();
    }, answerTime);
  }, revealTime);
}

function processRoundResults() {
  // clear timer if it exists
  if (gameState.roundTimer) {
    clearTimeout(gameState.roundTimer);
    gameState.roundTimer = null;
  }

  const question = questions[gameState.currentQuestion];
  const correctAnswer = question.correctAnswer;

  // calculate scores
  const playerAnswers = Object.entries(gameState.answers);
  const correctPlayers = playerAnswers.filter(([_, ans]) => ans.choice === correctAnswer);
  const allCorrect = correctPlayers.length === playerAnswers.length;

  // sort by timestamp to find who was first
  const sortedAnswers = playerAnswers.sort((a, b) => a[1].timestamp - b[1].timestamp);
  const firstCorrectPlayer = sortedAnswers.find(([_, ans]) => ans.choice === correctAnswer)?.[0];

  // award points
  playerAnswers.forEach(([playerId, answer]) => {
    let points = 0;
    
    if (answer.choice === correctAnswer) {
      points = 10; // base points for correct answer
      
      if (allCorrect) {
        points += 5; // bonus if everyone got it right
      }
      
      if (playerId === firstCorrectPlayer && correctPlayers.length > 1) {
        points += 5; // bonus for being first
      }
    }

    gameState.scores[playerId] += points;
  });

  // send results to all players
  Object.keys(gameState.players).forEach(playerId => {
    io.to(playerId).emit('roundResults', {
      playerId: playerId,
      scores: gameState.scores,
      correctAnswer: correctAnswer,
      playerAnswers: gameState.answers,
      pointsEarned: gameState.answers[playerId] ? 
        (gameState.answers[playerId].choice === correctAnswer ? 10 : 0) : 0
    });
  });

  // move to next question
  gameState.currentQuestion++;
  setTimeout(() => {
    sendNextQuestion();
  }, 5000); // wait 5 seconds before next question
}

async function endGame() {
  io.emit('gameEnd', gameState.scores);

  // Save game data to FastAPI backend
  try {
    console.log('Saving game session to database...');

    // Save session metadata
    await saveGameSession({
      sessionId: gameState.sessionId,
      startTime: gameState.sessionStartTime,
      endTime: new Date().toISOString(),
      questionCount: questions.length,
      status: 'completed'
    });

    // Convert socket IDs to user IDs for saving scores
    const userScores = {};
    Object.entries(gameState.scores).forEach(([socketId, score]) => {
      const player = gameState.players[socketId];
      if (player && player.userId) {
        userScores[player.userId] = score;
      }
    });

    // Save final scores and rankings
    await saveGameResults(gameState.sessionId, userScores);

    console.log(`Game session ${gameState.sessionId} saved successfully!`);
  } catch (error) {
    console.error('Error saving game session to database:', error);
    // Continue with game reset even if database save fails
  }

  // reset game after a delay
  setTimeout(() => {
    gameState.gameStarted = false;
    gameState.currentQuestion = 0;
    gameState.answers = {};
    gameState.sessionId = null;
    gameState.sessionStartTime = null;
    Object.keys(gameState.scores).forEach(pid => {
      gameState.scores[pid] = 0;
    });
  }, 10000);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Game server running on port ${PORT}`);
  console.log(`Backend URL: ${process.env.BACKEND_URL || 'http://backend:8000'}`);
});