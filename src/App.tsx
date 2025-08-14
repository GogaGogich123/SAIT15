import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import RatingPage from './pages/RatingPage';
import CadetProfile from './pages/CadetProfile';
import NewsPage from './pages/NewsPage';
import TasksPage from './pages/TasksPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ForumPage from './pages/ForumPage';
import ForumTopicPage from './pages/ForumTopicPage';
import CreateTopicPage from './pages/CreateTopicPage';
import EventsPage from './pages/EventsPage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {

  return (
    <div className="min-h-screen gradient-bg">
        <Header />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rating" element={<RatingPage />} />
            <Route path="/cadet/:id" element={<CadetProfile />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/forum/topic/:id" element={<ForumTopicPage />} />
            <Route path="/forum/create-topic" element={<CreateTopicPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;