import React, { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import ChatBox from '../components/Chat/ChatBox';
import ChatHistory from '../components/Chat/ChatHistory';
import { sendChatQuestion } from '../services/api';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (question) => {
    setMessages((msgs) => [...msgs, { role: 'user', content: question }]);
    setLoading(true);
    setError('');
    try {
      const res = await sendChatQuestion(question);
      if (res.summary) {
        setMessages((msgs) => [...msgs, { role: 'ai', content: res.summary }]);
      } else if (res.response) {
        setMessages((msgs) => [...msgs, { role: 'ai', content: res.response }]);
      } else {
        setMessages((msgs) => [...msgs, { role: 'ai', content: 'No response from AI.' }]);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Error contacting AI backend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 800,
        mx: 'auto',
        pt: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '80vh',
        alignItems: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>AI Chat Assistant</Typography>
      {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
      <Box sx={{ 
        flex: 1, 
        minHeight: 300, 
        maxHeight: 500, 
        overflowY: 'auto', 
        mb: 2, 
        background: '#2d2d2d', 
        borderRadius: 2,
        width: '100%',
        p: 2
      }}>
        <ChatHistory messages={messages} loading={loading} />
      </Box>
      <Box sx={{ width: '100%' }}>
        <ChatBox onSend={handleSend} loading={loading} />
      </Box>
    </Box>
  );
};

export default ChatPage; 