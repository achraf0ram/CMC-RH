import React, { useEffect, useState } from 'react';
import axiosInstance from '@/components/Api/axios';
import { Users, FileText, AlertTriangle } from 'lucide-react';

interface NotificationItem {
  type: 'user' | 'request' | 'urgent';
  id: number;
  title: string;
  message: string;
  date: string;
}

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const usersRes = await axiosInstance.get('/admin/users');
        const usersArray = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || usersRes.data.users || [];
        const users = usersArray.slice(0, 5).map((u: any) => ({
          type: 'user',
          id: u.id,
          title: 'Nouveau utilisateur',
          message: u.name + ' vient de s\'inscrire',
          date: u.created_at,
        }));
        const reqRes = await axiosInstance.get('/admin/requests');
        const requestsArray = Array.isArray(reqRes.data) ? reqRes.data : reqRes.data.data || reqRes.data.requests || [];
        const requests = requestsArray.slice(0, 5).map((r: any) => ({
          type: 'request',
          id: r.id,
          title: 'Nouvelle demande',
          message: r.full_name + ' a soumis une demande: ' + r.type,
          date: r.created_at,
        }));
        const urgentRes = await axiosInstance.get('/admin/urgent-messages');
        const urgentsArray = Array.isArray(urgentRes.data) ? urgentRes.data : urgentRes.data.data || urgentRes.data.urgents || [];
        const urgents = urgentsArray.slice(0, 5).map((m: any) => ({
          type: 'urgent',
          id: m.id,
          title: 'Message urgent',
          message: m.user?.name + ': ' + m.message,
          date: m.created_at,
        }));
        const all = [...users, ...requests, ...urgents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotifications(all.slice(0, 7));
      } catch (error) {
        setNotifications([]);
        // يمكنك أيضًا حفظ رسالة الخطأ في state لعرضها
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="p-2">
      <h4 className="font-semibold text-slate-800 mb-2">Notifications</h4>
      {loading && <div>Chargement...</div>}
      {!loading && notifications.length === 0 && <div className="text-gray-500">Aucune notification récente.</div>}
      <ul className="space-y-2">
        {notifications.map((notif) => (
          <li key={notif.type + notif.id} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50">
            {notif.type === 'user' && <Users className="w-5 h-5 text-blue-500 mt-1" />}
            {notif.type === 'request' && <FileText className="w-5 h-5 text-green-600 mt-1" />}
            {notif.type === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />}
            <div>
              <div className="font-medium">{notif.title}</div>
              <div className="text-xs text-gray-700 mb-1">{notif.message}</div>
              <div className="text-xs text-gray-400">{new Date(notif.date).toLocaleString('fr-FR')}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 