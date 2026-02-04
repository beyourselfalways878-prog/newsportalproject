import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  const isAllowed = user && allowedRoles.includes(user.role);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
