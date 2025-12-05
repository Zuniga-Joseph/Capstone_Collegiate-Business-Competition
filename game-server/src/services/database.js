import dotenv from 'dotenv';

dotenv.config();

// FastAPI backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8000';
const API_V1_STR = process.env.API_V1_STR || '/api/v1';

/**
 * Save a game session via FastAPI
 * @param {Object} session - Session data
 * @returns {Promise<Object>} - Saved session
 */
export async function saveGameSession(session) {
  const response = await fetch(`${BACKEND_URL}${API_V1_STR}/game/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_id: session.eventId || null,
      join_code: session.joinCode || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save game session: ${response.statusText}`);
  }

  const data = await response.json();

  // Update the session with status and times
  await fetch(`${BACKEND_URL}${API_V1_STR}/game/sessions/${data.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: session.status || 'completed',
      question_count: session.questionCount || 0,
      start_time: session.startTime,
      end_time: session.endTime || new Date().toISOString(),
    }),
  });

  return data;
}

/**
 * Add a participant to a game session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result
 */
export async function addParticipant(sessionId, userId) {
  const response = await fetch(
    `${BACKEND_URL}${API_V1_STR}/game/sessions/${sessionId}/participants/${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add participant: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Save game results for all players in a session
 * @param {string} sessionId - Session ID
 * @param {Object} scores - Player scores object { userId: score }
 * @returns {Promise<Object>} - Result
 */
export async function saveGameResults(sessionId, scores) {
  const response = await fetch(
    `${BACKEND_URL}${API_V1_STR}/game/sessions/${sessionId}/scores`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scores),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to save game results: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get session leaderboard
 * @param {string} sessionId - Session ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} - Leaderboard data
 */
export async function getSessionLeaderboard(sessionId, token) {
  const response = await fetch(
    `${BACKEND_URL}${API_V1_STR}/game/sessions/${sessionId}/leaderboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get leaderboard: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get global leaderboard
 * @param {string} token - Auth token
 * @param {number} limit - Number of top players
 * @returns {Promise<Array>} - Leaderboard entries
 */
export async function getGlobalLeaderboard(token, limit = 100) {
  const response = await fetch(
    `${BACKEND_URL}${API_V1_STR}/game/leaderboard/global?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get global leaderboard: ${response.statusText}`);
  }

  return await response.json();
}
