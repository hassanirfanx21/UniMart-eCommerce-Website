// recommendation_service.js
// Collaborative Filtering Recommendation Service using pre-trained SVD model

const { spawn } = require('child_process');
const path = require('path');

/**
 * Generate top-N product recommendations for a user using the trained SVD model
 * @param {number} userId - The user ID from the database
 * @param {number} topN - Number of recommendations to return (default: 10)
 * @param {number} minRating - Minimum predicted rating threshold (default: 4.0)
 * @returns {Promise<Array>} Array of recommended product IDs with predicted ratings
 */
function getRecommendations(userId, topN = 10, minRating = 4.0) {
  return new Promise((resolve, reject) => {
    // Path to the Python script that loads pickles and generates recommendations
    const pythonScript = path.join(__dirname, 'recommendation_model', 'recommend.py');
    
    // Spawn Python process
    const pythonProcess = spawn('python', [
      pythonScript,
      userId.toString(),
      topN.toString(),
      minRating.toString()
    ]);

    let dataString = '';
    let errorString = '';

    // Collect data from Python stdout
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Collect errors from Python stderr
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python error:', errorString);
        return reject(new Error(`Python process exited with code ${code}: ${errorString}`));
      }

      try {
        // Parse JSON output from Python
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (err) {
        console.error('Failed to parse Python output:', dataString);
        reject(new Error('Invalid JSON from Python script'));
      }
    });

    // Handle process errors
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

module.exports = { getRecommendations };
