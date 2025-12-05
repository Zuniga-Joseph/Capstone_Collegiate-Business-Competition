import {
  getGameSessions,
  getGameSession,
  getSessionResults
} from '../../services/database.js';

/**
 * List all game sessions
 * GET /api/public/sessions
 */
export async function listSessions(event) {
  try {
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;

    const sessions = await getGameSessions(limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        sessions,
        count: sessions.length
      })
    };
  } catch (error) {
    console.error('Error listing sessions:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to retrieve sessions',
        message: error.message
      })
    };
  }
}

/**
 * Get detailed information about a specific session
 * GET /api/public/sessions/{sessionId}
 */
export async function getSessionDetails(event) {
  try {
    const sessionId = event.pathParameters?.sessionId;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Session ID is required'
        })
      };
    }

    const [session, results] = await Promise.all([
      getGameSession(sessionId),
      getSessionResults(sessionId)
    ]);

    if (!session) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Session not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        session,
        results
      })
    };
  } catch (error) {
    console.error('Error getting session details:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to retrieve session details',
        message: error.message
      })
    };
  }
}
