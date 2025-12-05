import {
  getGlobalLeaderboard,
  getSessionResults,
  getStatsSummary
} from '../../services/database.js';

/**
 * Get global leaderboard
 * GET /api/public/leaderboard
 */
export async function getGlobalLeaderboardHandler(event) {
  try {
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 100;

    const leaderboard = await getGlobalLeaderboard(limit);

    // Add rank numbers
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      rank: index + 1,
      ...player
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        leaderboard: rankedLeaderboard,
        count: rankedLeaderboard.length
      })
    };
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to retrieve global leaderboard',
        message: error.message
      })
    };
  }
}

/**
 * Get leaderboard for a specific session
 * GET /api/public/leaderboard/session/{sessionId}
 */
export async function getSessionLeaderboard(event) {
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

    const results = await getSessionResults(sessionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        sessionId,
        leaderboard: results,
        count: results.length
      })
    };
  } catch (error) {
    console.error('Error getting session leaderboard:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to retrieve session leaderboard',
        message: error.message
      })
    };
  }
}

/**
 * Get statistics summary
 * GET /api/public/stats/summary
 */
export async function getStatsSummaryHandler(event) {
  try {
    const summary = await getStatsSummary();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(summary)
    };
  } catch (error) {
    console.error('Error getting stats summary:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to retrieve statistics summary',
        message: error.message
      })
    };
  }
}