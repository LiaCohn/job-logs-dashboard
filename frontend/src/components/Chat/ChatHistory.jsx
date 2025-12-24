import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

const ChatHistory = ({ messages, loading }) => {
  return (
    <Box
      sx={{
        maxHeight: '100%',
        overflowY: 'auto',
        pr: 1,
      }}
    >
      {messages.length === 0 && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <Typography variant="body2" color="text.secondary">
            No messages yet. Start a conversation!
          </Typography>
        </Box>
      )}
      {messages.map((msg, idx) => (
        <Box key={idx} display="flex" justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'} mb={1}>
          <Paper sx={{ 
            p: 2, 
            maxWidth: '70%', 
            bgcolor: msg.role === 'user' ? 'primary.dark' : 'grey.800',
            color: 'text.primary'
          }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: 'inherit' }}>{msg.content}</Typography>
          </Paper>
        </Box>
      ))}
      {loading && (
        <Box display="flex" justifyContent="flex-start" mb={1}>
          <Paper sx={{ p: 2, maxWidth: '70%', bgcolor: 'grey.800' }}>
            <CircularProgress size={20} />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ChatHistory; 