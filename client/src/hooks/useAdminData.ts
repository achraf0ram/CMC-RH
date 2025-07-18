import { useState, useEffect, useCallback } from 'react';
import { axiosInstance as api } from '@/components/Api/axios';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  is_admin: boolean;
  profile_photo_url: string;
  last_seen?: string;
}

export interface Request {
  id: number;
  full_name: string;
  matricule: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  file_path: string | null;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    profile_photo_url: string;
  };
  [key: string]: any;
}

export interface Stats {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export const useAdminData = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [requestsRes, usersRes, statsRes] = await Promise.all([
        api.get('/admin/requests'),
        api.get('/admin/users'),
        api.get('/admin/summary')
      ]);
      setRequests(requestsRes.data.requests);
      setUsers(usersRes.data.users);
      setStats(statsRes.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unknown error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // دالة منفصلة لتحديث الشعارات فقط
  const fetchUsersForAvatars = useCallback(async () => {
    try {
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.users);
    } catch (err: any) {
      // لا نعرض خطأ هنا لأنها تحديث تلقائي للشعارات فقط
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // تحديث الشعارات كل 5 ثوانٍ
  useEffect(() => {
    const interval = setInterval(fetchUsersForAvatars, 5000);
    return () => clearInterval(interval);
  }, [fetchUsersForAvatars]);

  return { requests, users, stats, isLoading, error, refreshData: fetchData, setRequests };
}; 