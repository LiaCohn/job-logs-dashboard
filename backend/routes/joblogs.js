const express = require('express');
const router = express.Router();
const JobLog = require('../models/JobLog');

// GET /api/joblogs?startDate=&endDate=&client=&country=&page=&limit=&sortField=&sortOrder=
router.get('/', async (req, res) => {
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

module.exports = router;

