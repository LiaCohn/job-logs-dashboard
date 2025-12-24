import React from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';

const DashboardMetrics = ({ averageMetric, deltaMetric, loading }) => {
  const topAvg = averageMetric && averageMetric[0];
  const topDelta = deltaMetric && deltaMetric[0];

  return (
    <Box display="flex" gap={2} mb={3} justifyContent="center" flexWrap="wrap">
      <Card sx={{ minWidth: 200 }}>
        <CardContent>
          <Typography variant="h6">Top Average Jobs Sent</Typography>
          {loading ? <CircularProgress size={24} /> : (
            <>
              <Typography variant="h4">{topAvg ? topAvg.average?.toFixed(0) : '--'}</Typography>
              <Typography variant="body2">{topAvg ? topAvg._id : ''}</Typography>
            </>
          )}
        </CardContent>
      </Card>
      <Card sx={{ minWidth: 200 }}>
        <CardContent>
          <Typography variant="h6">Increase/Decrease in Jobs Sent</Typography>
          {loading ? <CircularProgress size={24} /> : (
            <>
              <Typography variant="h4">{topDelta ? topDelta.delta?.toFixed(0) : '--'}</Typography>
              <Typography variant="body2">{topDelta ? topDelta._id : ''}</Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardMetrics; 