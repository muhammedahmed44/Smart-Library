import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsLoading } from '../store/slices/authSlice';
import Spinner from '../components/shared/Spinner';

export function ProtectedRoute({ children, roles }) {
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-parchment-50 dark:bg-ink-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-parchment-50 dark:bg-ink-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
