const express = require('express');
const router = express.Router();
const axios = require('axios');
const JobLog = require('../models/JobLog');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Test endpoint to verify route is working
router.get('/', (req, res) => {
  res.json({ message: 'Chat route is working', hasApiKey: !!GROQ_API_KEY });
});

// AI Chat Assistant Endpoint
router.post('/', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });
  
  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is not configured');
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  // Step 1: Ask LLM for a MongoDB aggregation pipeline
  const systemPrompt = `You are an assistant for analyzing job-trading logs. The MongoDB collection is called joblogs. The schema is: { country_code, currency_code, progress: { SWITCH_INDEX, TOTAL_RECORDS_IN_FEED, TOTAL_JOBS_FAIL_INDEXED, TOTAL_JOBS_IN_FEED, TOTAL_JOBS_SENT_TO_ENRICH, TOTAL_JOBS_DONT_HAVE_METADATA, TOTAL_JOBS_DONT_HAVE_METADATA_V2, TOTAL_JOBS_SENT_TO_INDEX }, status, timestamp, transactionSourceName, noCoordinatesCount, recordCount, uniqueRefNumberCount }. Given a user question, respond ONLY with a valid MongoDB aggregation pipeline as a JSON array, and nothing else. Use only valid JSON. Do not use JavaScript or shell helpers like ISODate(). For dates, use ISO 8601 strings (e.g., '2025-07-01T00:00:00Z'). Always quote all keys in the JSON output.`;

  try {
    // 1. Get aggregation pipeline from LLM
    const llmResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Extract pipeline from LLM response
    let pipeline;
    try {
      // Try to parse the first code block as JSON
      const content = llmResponse.data.choices[0].message.content;


      const match = content.match(/```(?:json)?\n([\s\S]*?)```/);
      pipeline = match ? JSON.parse(match[1]) : JSON.parse(content);

    } catch (e) {
      console.error('❌ ERROR parsing LLM response:', e.message);
      return res.status(400).json({ 
        error: 'Failed to parse aggregation pipeline from LLM response.',
        details: e.message 
      });
    }


    // Convert string dates in $match.timestamp to Date objects
    if (Array.isArray(pipeline) && pipeline[0]?.$match?.timestamp) {
      const ts = pipeline[0].$match.timestamp;
      if (ts.$gte && typeof ts.$gte === 'string') ts.$gte = new Date(ts.$gte);
      if (ts.$gt && typeof ts.$gt === 'string') ts.$gt = new Date(ts.$gt);
      if (ts.$lte && typeof ts.$lte === 'string') ts.$lte = new Date(ts.$lte);
      if (ts.$lt && typeof ts.$lt === 'string') ts.$lt = new Date(ts.$lt);
    }
    // 2. Run the pipeline on MongoDB
    const result = await JobLog.aggregate(pipeline);
    // 3. Optionally, ask LLM to summarize the result
    const summaryPrompt = `Given the following MongoDB aggregation result, summarize the answer to the user's question. User question: "${question}". Result: ${JSON.stringify(result)}`;
    const summaryResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: summaryPrompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const summary = summaryResponse.data.choices[0].message.content;
    // 4. Return both the raw data and the summary
    res.json({ data: result, summary });

  } catch (err) {
    console.error('❌ ERROR in /api/chat:', err.message);
    console.error('Full error:', err);
    
    // Provide more specific error messages
    if (err.response) {
      // Axios error from Groq API
      return res.status(500).json({ 
        error: 'AI API error', 
        details: err.response.data?.error?.message || err.message 
      });
    } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      // MongoDB error
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    } else {
      // Generic error
      return res.status(500).json({ 
        error: 'AI or DB error', 
        details: err.message 
      });
    }
  }
});

module.exports = router;

