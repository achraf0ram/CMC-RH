import React from 'react';

interface AdminActionsProps {
  onRefresh: () => void;
  stats: {
    totalUsers: number;
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
  };
}

export const AdminActions: React.FC<AdminActionsProps> = ({ onRefresh, stats }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <h3 className="font-semibold text-lg mb-2">Admin Actions</h3>
      <p className="text-sm text-gray-600">Quick actions and overview.</p>
      {/* More action buttons can be added here */}
    </div>
  );
}; 