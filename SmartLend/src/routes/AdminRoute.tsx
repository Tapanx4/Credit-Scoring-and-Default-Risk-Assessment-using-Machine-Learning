
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';
import type { JSX } from 'react';

export const AdminRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { role } = useAuth();

  return (
    <ProtectedRoute>
      {role === 'admin' ? (
        children
      ) : (
        <Navigate to="/underwriter" replace />
      )}
    </ProtectedRoute>
  );
};

