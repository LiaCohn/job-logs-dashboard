const express = require('express');
const router = express.Router();
const JobLog = require('../models/JobLog');

// Analytics: general endpoint: average or total
router.get('/general', async (req, res) => {
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
router.get('/delta', async (req, res) => {
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

module.exports = router;

