const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');


// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const GROQ_API_KEY =  process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';


// MongoDB connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const JobLog = require('./models/JobLog');

// GET /api/joblogs?startDate=&endDate=&client=&country=&page=&limit=&sortField=&sortOrder=
app.get('/api/joblogs', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      client,
      country,
      page = 1,
      limit = 20,
      sortField = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (client) filter.transactionSourceName = client;
    if (country) filter.country_code = country;

    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    const jobLogs = await JobLog.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await JobLog.countDocuments(filter);

    res.json({
      data: jobLogs,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Analytics: general endpoint: average or total
app.get('/api/joblogs/metrics/general', async (req, res) => {
  try {
    const { field, groupBy = 'transactionSourceName', startDate, endDate, client, country, agg = 'average' } = req.query;
    if (!field) return res.status(400).json({ error: 'Missing field parameter' });
    const match = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    if (client) match.transactionSourceName = client;
    if (country) match.country_code = country;
    const groupField = `$${groupBy}`;
    const valueField = `progress.${field}`;
    const groupStage = {
      _id: groupField,
      count: { $sum: 1 },
    };
    if (agg === 'sum') {
      groupStage.total = { $sum: `$${valueField}` };
    } else {
      groupStage.average = { $avg: `$${valueField}` };
    }
    const results = await JobLog.aggregate([
      { $match: match },
      { $group: groupStage },
      { $sort: agg === 'sum' ? { total: -1 } : { average: -1 } }
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Analytics: Delta (change between first and last in period)
app.get('/api/joblogs/metrics/delta', async (req, res) => {
  try {
    const { field, groupBy = 'transactionSourceName', startDate, endDate, client, country } = req.query;
    if (!field) return res.status(400).json({ error: 'Missing field parameter' });
    const match = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }
    if (client) match.transactionSourceName = client;
    if (country) match.country_code = country;
    const groupField = `$${groupBy}`;
    const valueField = `progress.${field}`;
    const results = await JobLog.aggregate([
      { $match: match },
      { $sort: { timestamp: 1 } },
      { $group: {
        _id: groupField,
        first: { $first: `$${valueField}` },
        last: { $last: `$${valueField}` },
        count: { $sum: 1 },
      }},
      { $project: {
        delta: { $subtract: ['$last', '$first'] },
        first: 1,
        last: 1,
        count: 1,
      }},
      { $sort: { delta: -1 } }
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


// AI Chat Assistant Endpoint
app.post('/api/chat', async (req, res) => {

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

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

      console.error({content});


      const match = content.match(/```(?:json)?\n([\s\S]*?)```/);
      pipeline = match ? JSON.parse(match[1]) : JSON.parse(content);

    } catch (e) {

      return res.status(400).json({ error: 'Failed to parse aggregation pipeline from LLM response.' });
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

    res.status(500).json({ error: 'AI or DB error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 