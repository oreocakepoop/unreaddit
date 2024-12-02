import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PostProvider } from './context/PostContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

// Private Route wrapper
function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
}

// Public Route wrapper
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return !currentUser ? children : <Navigate to="/" />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: '/signup',
    element: <PublicRoute><Signup /></PublicRoute>,
  },
  {
    path: '/',
    element: <PrivateRoute><Layout><Home /></Layout></PrivateRoute>,
  },
  {
    path: '/explore',
    element: <PrivateRoute><Layout><Explore /></Layout></PrivateRoute>,
  },
  {
    path: '/notifications',
    element: <PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>,
  },
  {
    path: '/profile',
    element: <PrivateRoute><Layout><Profile /></Layout></PrivateRoute>,
  },
]);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PostProvider>
          <RouterProvider router={router} />
        </PostProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
