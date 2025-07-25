import React, { useState, useRef } from 'react';
import { MessageCircle, Image as ImageIcon, Send, AlertTriangle, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import axiosInstance from '@/components/Api/axios';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import ReactDOM from 'react-dom';

interface UrgentChatButtonProps {
  hide?: boolean;
}

const UrgentChatButton: React.FC<UrgentChatButtonProps> = ({ hide }) => {
  if (hide) return null; 

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [admin, setAdmin] = useState<any>(null);
  const [image, setImage] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  // جلب الأدمن (تعيين ثابت)
  useEffect(() => {
    if (user && !user.is_admin) {
      setAdmin({ id: 1, name: "Admin" }); // أدمين ثابت id=1
    }
  }, [user]);

  // جلب الرسائل وحساب unreadCount عند تحميل الصفحة أو كل 5 ثوانٍ حتى لو لم تُفتح الدردشة
  useEffect(() => {
    let interval;
    const fetchMessages = () => {
      if (admin) {
        axiosInstance.get(`/chat/${admin.id}`).then(res => {
          setMessages(res.data);
          const lastReadId = Number(localStorage.getItem('lastReadChatId') || 0);
          const unread = res.data.filter(msg => msg.id > lastReadId && msg.from_user_id === admin.id).length;
          setUnreadCount(unread);
        });
      }
    };
    fetchMessages();
    interval = setInterval(fetchMessages, 5000);
    return () => { if (interval) clearInterval(interval); };
  }, [admin]);

  // عند فتح الدردشة، اعتبر كل الرسائل مقروءة
  useEffect(() => {
    if (sidebarOpen && messages.length > 0) {
      const lastId = messages[messages.length - 1].id;
      localStorage.setItem('lastReadChatId', lastId);
      setUnreadCount(0);
    }
  }, [sidebarOpen, messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // تشغيل صوت عند استقبال رسالة جديدة ليست من المستخدم الحالي
  const prevMessagesCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.from_user_id !== user?.id) {
        // playMessageSound(); // احذف: import { playMessageSound } from '../utils/sounds';
      }
    }
    prevMessagesCount.current = messages.length;
  }, [messages, user]);

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('to_user_id', admin.id);
      if (message) formData.append('message', message);
      if (image) formData.append('image', image);
      if (file) formData.append('file', file);
      formData.append('is_urgent', isUrgent ? 'true' : 'false');
      const res = await axiosInstance.post('/chat/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessages(prev => [...prev, res.data]);
      setMessage('');
      setImage(null);
      setFile(null);
      setIsUrgent(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || t('urgentMessageError') || 'حدث خطأ أثناء الإرسال');
    } finally {
      setLoading(false);
    }
  };

  // نافذة منبثقة صغيرة مع حركة
  // ترجمة النصوص حسب اللغة
  const tChatWithAdmin = language === 'fr' ? 'Discuter avec l\'administration' : t('chatWithAdmin') || 'دردشة مع الإدارة';
  const tTypeMessage = language === 'fr' ? 'Écrire un message...' : t('typeMessage') || 'اكتب رسالتك...';
  const tNoMessages = language === 'fr' ? 'Aucun message' : t('noMessages') || 'لا توجد رسائل بعد';
  const tSendImage = language === 'fr' ? 'Envoyer une image' : 'إرسال صورة';
  const tSendFile = language === 'fr' ? 'Envoyer un fichier' : 'إرسال ملف';
  const tSend = language === 'fr' ? 'Envoyer' : t('send') || 'إرسال';

  function formatTime(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    let hours = date.getHours();
    let minutes = date.getMinutes().toString().padStart(2, '0');
    let time = `${hours}:${minutes}`;
    // إذا كانت اللغة عربية، استبدل الأرقام بأرقام عربية هندية
    if (language === 'ar') {
      const arabicNumbers = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
      time = time.replace(/[0-9]/g, d => arabicNumbers[parseInt(d)]);
    }
    return time;
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return '📄';
    if (fileType === 'doc' || fileType === 'docx') return '📝';
    if (fileType === 'txt') return '📄';
    return '📎';
  };

  // دالة توليد رابط الصورة بشكل آمن
  const getChatImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    // إزالة أي '/api/' أو 'api/' من البداية إذا وجدت
    let cleanPath = imagePath.replace(/^\/api\//, '').replace(/^api\//, '');
    if (cleanPath.startsWith('storage/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${cleanPath}`;
    }
    if (cleanPath.startsWith('chat_images/')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${cleanPath}`;
    }
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/chat_images/${cleanPath}`;
  };

  return (
    <>
      {/* زر عائم */}
      <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-[9999]`}>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-colors duration-200 relative"
          onClick={() => setSidebarOpen(true)}
          title={tChatWithAdmin}
          type="button"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
      {/* نافذة الشات المنبثقة الصغيرة */}
      <div
        className={`fixed ${language === 'ar' ? 'left-6' : 'right-6'} bottom-24 z-[10000] transition-all duration-300 ${sidebarOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        style={{ width: 350, maxWidth: '90vw', height: 420 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full border border-blue-100">
          {/* شريط علوي */}
          <div className="flex items-center justify-between p-3 border-b bg-blue-50 rounded-t-2xl">
            <span className="font-bold text-blue-700 text-base">{tChatWithAdmin}</span>
            <button className="text-gray-500 hover:text-gray-700 text-xl" onClick={() => setSidebarOpen(false)}>&times;</button>
          </div>
          {/* منطقة الرسائل */}
          <div className="flex-1 overflow-y-auto px-3 py-0 space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-10">{tNoMessages}</div>
            )}
            {messages.map((msg, idx) => (
              <div key={msg.id || `${msg.from_user_id}-${msg.created_at || idx}`}
                className={`p-2 rounded-lg max-w-[80%] text-sm ${msg.from_user_id === user.id ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-100 self-start mr-auto'}${msg.is_urgent ? ' border border-red-500 text-red-800 bg-red-100' : ''}`}
                style={{ wordBreak: 'break-word' }}>
                {msg.image_path && (
                  <>
                    <img
                      src={msg.image_url || getChatImageUrl(msg.image_path)}
                      alt="chat-img"
                      className="max-w-[120px] max-h-[120px] mb-1 rounded shadow cursor-pointer border border-gray-300"
                      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                      onClick={() => setModalImage(msg.image_url || getChatImageUrl(msg.image_path))}


                    />
                    {modalImage && ReactDOM.createPortal(
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          width: '100vw',
                          height: '100vh',
                          background: 'rgba(0,0,0,0.85)',
                          zIndex: 2147483647,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={() => setModalImage(null)}
                      >
                        <button
                          style={{
                            position: 'absolute',
                            top: 32,
                            right: 40,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            fontSize: 24,
                            cursor: 'pointer',
                            zIndex: 2147483648,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onClick={e => { e.stopPropagation(); setModalImage(null); }}
                          aria-label="إغلاق الصورة"
                        >✕</button>
                        <img
                          src={modalImage}
                          alt="chat-img-large"
                          style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            borderRadius: 12,
                            boxShadow: '0 0 20px #0008',
                            background: '#fff',
                            display: 'block',
                            margin: 'auto',
                          }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>,
                      document.body
                    )}
                  </>
                )}
                {msg.file_path && (
                  <div className="mb-1">
                    <a
                      href={msg.file_url || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-lg">{getFileIcon(msg.file_type)}</span>
                      <span className="text-sm font-medium text-blue-700">
                        {language === 'fr' ? 'Fichier joint' : 'ملف مرفق'}
                      </span>
                    </a>
                  </div>
                )}
                {msg.message && msg.message !== '0' && (
                  <div className="flex flex-col gap-1">
                    <div>{msg.message}</div>
                    <div className={`text-[11px] text-gray-500 mt-1 ${msg.from_user_id === user.id ? 'text-left' : 'text-right'}`}>{formatTime(msg.created_at)}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* منطقة الإدخال */}
          <form
            className="flex gap-1 items-center p-3 border-t bg-white rounded-b-2xl"
            onSubmit={e => { e.preventDefault(); handleSend(); }}
          >
            {/* صورة مصغرة قبل الإرسال */}
            {image && (
              <div className="relative mr-2">
                <img src={URL.createObjectURL(image)} alt="preview" className="w-12 h-12 object-cover rounded shadow border" />
                <button type="button" onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
              </div>
            )}
            {/* ملف مصغر قبل الإرسال */}
            {file && (
              <div className="relative mr-2">
                <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                  <span className="text-lg">{getFileIcon(file.name.split('.').pop() || '')}</span>
                </div>
                <button type="button" onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
              </div>
            )}
            <input
              className="flex-1 border rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-100"
              placeholder={tTypeMessage}
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={loading}
              style={{ minWidth: 0 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setImage(e.target.files?.[0] || null)}
              disabled={loading}
              className="hidden"
              id="chat-image-upload"
            />
            <label htmlFor="chat-image-upload" className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-full transition ${image ? 'bg-blue-100 border border-blue-400' : 'bg-gray-200 hover:bg-blue-50'}`} title={tSendImage}>
              <ImageIcon className="w-5 h-5 text-blue-600" />
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={e => setFile(e.target.files?.[0] || null)}
              disabled={loading}
              className="hidden"
              id="chat-file-upload"
            />
            <label htmlFor="chat-file-upload" className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-full transition ${file ? 'bg-green-100 border border-green-400' : 'bg-gray-200 hover:bg-green-50'}`} title={tSendFile}>
              <FileText className="w-5 h-5 text-green-600" />
            </label>
            <button
              type="button"
              className={`cursor-pointer flex items-center justify-center w-8 h-8 rounded-full transition border-none outline-none ${isUrgent ? 'bg-red-100 border border-red-400' : 'bg-gray-100 hover:bg-red-50'}`}
              title={language === 'fr' ? 'Message urgent' : 'رسالة عاجلة'}
              onClick={() => setIsUrgent(v => !v)}
              style={{ border: 'none' }}
            >
              <AlertTriangle className={`w-5 h-5 transition ${isUrgent ? 'text-red-600' : 'text-red-400'}`} />
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white w-9 h-9 flex items-center justify-center rounded-full font-bold text-base shadow transition"
              type="submit"
              disabled={loading || (!message.trim() && !image && !file)}
              title={tSend}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          {error && <div className="text-red-600 mt-1 text-center text-xs">{error}</div>}
        </div>
      </div>
    </>
  );
};

export default UrgentChatButton;