import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#646cff',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <nav className="navbar">
          <Link to="/">Dashboard</Link>
          <Link to="/chat">AI Chat Assistant</Link>
        </nav>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
