import React, { useEffect, useState } from 'react';
import axiosInstance from '@/components/Api/axios';

const AdminUrgentMessages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/admin/urgent-messages');
      setMessages(res.data);
    } catch (err: any) {
      setError('Erreur lors du chargement des messages urgents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette demande urgente ?')) return;
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/admin/urgent-messages/${id}`);
      setMessages(messages.filter(msg => msg.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const openReplyDialog = (id: number) => {
    setReplyingId(id);
    setReplyText('');
    setDialogOpen(true);
  };

  const handleReply = async () => {
    if (!replyText.trim() || replyingId === null) return;
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/admin/urgent-messages/${replyingId}/reply`, { admin_reply: replyText });
      setMessages(messages.map(msg =>
        msg.id === replyingId ? { ...msg, admin_reply: replyText, is_replied: true } : msg
      ));
      setDialogOpen(false);
    } catch {
      alert('Erreur lors de l\'envoi de la réponse');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
        Demandes urgentes
        <span className="text-xs text-gray-500">({messages.length})</span>
      </h2>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && messages.length === 0 && (
        <div className="text-gray-500">Aucune demande urgente pour le moment.</div>
      )}
      <ul className="space-y-4">
        {messages.map(msg => (
          <li key={msg.id} className="bg-red-50 border-l-4 border-red-600 p-4 rounded shadow relative">
            <div className="font-semibold text-red-800 mb-1 flex items-center gap-2">
              {msg.user?.name || 'Utilisateur inconnu'}
              {msg.is_replied && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Répondu</span>
              )}
            </div>
            <div className="text-gray-800 mb-2 whitespace-pre-line">{msg.message}</div>
            <div className="text-xs text-gray-500 mb-2">{new Date(msg.created_at).toLocaleString('fr-FR')}</div>
            {msg.admin_reply && (
              <div className="bg-green-50 border-l-4 border-green-600 p-2 rounded mb-2">
                <div className="text-green-800 font-semibold">Réponse de l'admin :</div>
                <div className="text-green-900">{msg.admin_reply}</div>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={() => openReplyDialog(msg.id)}
                disabled={actionLoading || msg.is_replied}
              >
                Répondre
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={() => handleDelete(msg.id)}
                disabled={actionLoading}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Dialog de réponse */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-blue-700">Répondre à la demande urgente</h3>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={4}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Votre réponse..."
              disabled={actionLoading}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setDialogOpen(false)}
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handleReply}
                disabled={actionLoading || !replyText.trim()}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUrgentMessages; 