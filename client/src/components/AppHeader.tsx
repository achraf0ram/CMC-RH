import { Search, Bell, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/useAdminData';
import axiosInstance from '@/components/Api/axios';
import { createEcho } from '../lib/echo';
import { ImageIcon, AlertTriangle, Send, FileText, Calendar, ClipboardCheck, CreditCard, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { playNotificationSound } from '@/utils/sounds';

// Context لمشاركة رسائل الشات
export const ChatMessagesContext = createContext<{
  chatMessages: any[];
  setChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
  chatOpen?: boolean;
  setChatOpen?: React.Dispatch<React.SetStateAction<boolean>>;
} | undefined>(undefined);

export const useChatMessages = () => {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx) throw new Error('useChatMessages must be used within ChatMessagesProvider');
  return ctx;
};

export const useSetChatOpen = () => {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx || !ctx.setChatOpen) throw new Error('useSetChatOpen must be used within ChatMessagesProvider');
  return ctx.setChatOpen;
};

export const ChatMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <ChatMessagesContext.Provider value={{ chatMessages, setChatMessages, chatOpen, setChatOpen }}>
      {children}
    </ChatMessagesContext.Provider>
  );
};

export const AppHeader = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastNotifIds, setLastNotifIds] = useState<number[]>([]);
  const { user, token } = useAuth();
  const [userNotifCount, setUserNotifCount] = useState(0);
  const [userNotifs, setUserNotifs] = useState<any[]>([]);
  const [userNotifOpen, setUserNotifOpen] = useState(false);
  const [visibleUserNotifCount, setVisibleUserNotifCount] = useState(5);
  const { chatOpen, setChatOpen, chatMessages, setChatMessages } = useChatMessages();
  const { users } = useAdminData();
  const [selectedUser, setSelectedUser] = useState<null | number>(null);
  const [search, setSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatUrgent, setChatUrgent] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: number]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 1. أضف state جديد لعرض الـ sidebar
  const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = w-72
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. أضف state جديد لتخزين آخر رسالة لكل مستخدم
  const [lastMessagesByUser, setLastMessagesByUser] = useState<{ [userId: number]: any }>({});

  // 2. دوال السحب
  const startResizing = () => { setIsResizing(true); };
  const stopResizing = () => { setIsResizing(false); };
  const resize = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSidebarWidth(e.clientX - rect.left);
  };
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
      };
    }
  }, [isResizing, language]);

  // جلب عدد الإشعارات غير المقروءة من backend الحقيقي
  useEffect(() => {
    const fetchNotifCount = async () => {
      if (user && user.is_admin) {
        const res = await axiosInstance.get('/admin/notifications/unread-count');
        const count = res.data.count || 0;
        setNotifCount(count);
      } else {
      }
    };
    fetchNotifCount();
    
    // إضافة polling للإدارة لتحديث عدد الإشعارات كل 30 ثانية
    let interval: NodeJS.Timeout;
    if (user && user.is_admin) {
      interval = setInterval(fetchNotifCount, 30000); // كل 30 ثانية
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // تحديث عدد الإشعارات عند تغيير المستخدم أو عند تحميل الصفحة
  useEffect(() => {
    if (user && user.is_admin) {
      const fetchNotifCount = async () => {
        try {
          const res = await axiosInstance.get('/admin/notifications/unread-count');
          const count = res.data.count || 0;
          setNotifCount(count);
        } catch (error) {
        }
      };
      fetchNotifCount();
    }
  }, [user?.id]); // تحديث عند تغيير معرف المستخدم

  // Debug: تتبع تغييرات العداد
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Notification count changed - Admin:', notifCount, 'User:', userNotifCount);
    }
  }, [notifCount, userNotifCount]);

  // عند فتح القائمة، اعتبر كل الإشعارات مقروءة في backend
  const handleNotifOpenChange = (open: boolean) => {
    setNotifOpen(open);
    if (open) {
      // عند فتح الإشعارات، أعد جلب العداد
      const fetchNotifCount = async () => {
        if (user && user.is_admin) {
          const res = await axiosInstance.get('/admin/notifications/unread-count');
        setNotifCount(res.data.count || 0);
        }
      };
      fetchNotifCount();
      
      // ثم اعتبارها مقروءة
      if (user && user.is_admin) {
      axiosInstance.post('/admin/notifications/mark-all-read').then(() => {
        setNotifCount(0);
      });
      }
    }
  };

  // إشعارات المستخدم العادي
  useEffect(() => {
    const fetchUserNotifCount = async () => {
    if (user && !user.is_admin) {
        try {
          const res = await axiosInstance.get('/notifications');
        const notifs = Array.isArray(res.data) ? res.data : [];
        setUserNotifs(notifs);
        setUserNotifCount(notifs.filter(n => !n.is_read).length);
        } catch (error) {
          console.error('❌ خطأ في جلب إشعارات المستخدم:', error);
        }
      }
    };

    fetchUserNotifCount();
    
    // إزالة التحديث الدوري - التحديث سيحدث فقط عند التفاعل
  }, [user]);

  const handleUserNotifOpenChange = (open: boolean) => {
    setUserNotifOpen(open);
    if (open && user && !user.is_admin) {
      // عند فتح الإشعارات، أعد جلب العداد
      const fetchUserNotifCount = async () => {
        try {
          const res = await axiosInstance.get('/notifications');
          const notifs = Array.isArray(res.data) ? res.data : [];
          setUserNotifs(notifs);
          setUserNotifCount(notifs.filter(n => !n.is_read).length);
        } catch (error) {
          console.error('❌ خطأ في جلب إشعارات المستخدم:', error);
        }
      };
      fetchUserNotifCount();
      
      // ثم اعتبارها مقروءة
      axiosInstance.post('/notifications/read-all').then(() => {
        setUserNotifCount(0);
        setUserNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      });
    }
  };

  // جلب الرسائل عند اختيار مستخدم (تعديل المسار + polling)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchMessages = () => {
      if (chatOpen && selectedUser) {
        axiosInstance.get(`/chat/${selectedUser}`).then(res => setChatMessages(res.data));
      }
    };
    fetchMessages();
    if (chatOpen && selectedUser) {
      interval = setInterval(fetchMessages, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [chatOpen, selectedUser]);

  // عداد الرسائل غير المقروءة العام (لكل الرسائل)
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user || !token) {
      if (user && !token && process.env.NODE_ENV === 'development') {
        console.warn('No auth token found for Echo!');
      }
      return;
    }
    
    console.log('Setting up WebSocket for user:', user.name, 'is_admin:', user.is_admin);
    
    const echo = createEcho(token);
    if (!echo) {
      console.error('Failed to create Echo instance');
      return;
    }

    console.log('Echo created successfully, setting up listeners');

    console.log('Setting up WebSocket listeners for user:', user.is_admin ? 'admin' : 'user');

    // استمع لرسائل الدردشة (حتى لو لم تكن نافذة الدردشة مفتوحة)
    const chatChannel = echo.private('chat.' + user.id);
    chatChannel.listen('NewChatMessage', (data: any) => {
      if (data.message.from_user_id !== user.id) {
        const fromId = data.message.from_user_id;
        setUnreadCounts(prev => {
          const newCount = (prev[fromId] || 0) + 1;
          return { ...prev, [fromId]: newCount };
        });
      }
      if (chatOpen && selectedUser && (data.message.from_user_id === selectedUser || data.message.to_user_id === selectedUser)) {
        setChatMessages(prev => [...prev, data.message]);
      }
    });

    // استمع للإشعارات (حتى لو لم تكن نافذة الإشعارات مفتوحة)
    const notifChannel = echo.channel('notifications');
    notifChannel.listen('NewNotification', (data: any) => {
      if (!user) return;
      if (user.is_admin) {
        setNotifCount((prev) => prev + 1);
        // تشغيل صوت الإشعار
        playNotificationSound();
      } else {
        setUserNotifCount((prev) => prev + 1);
        // تشغيل صوت الإشعار
        playNotificationSound();
      }
    });

    // استمع لإشعارات الإدارة بشكل منفصل
    if (user && user.is_admin) {
      const adminNotifChannel = echo.channel('admin-notifications');
      adminNotifChannel.listen('NewAdminNotification', (data: any) => {
        console.log('Admin notification received via admin-notifications channel');
        setNotifCount((prev) => prev + 1);
        // تشغيل صوت الإشعار
        playNotificationSound();
      });
    }

    // استمع لإشعارات المستخدم العادي
    if (user && !user.is_admin) {
      const userNotifChannel = echo.channel('user-notifications');
      userNotifChannel.listen('NewUserNotification', (data: any) => {
        console.log('User notification received via user-notifications channel');
        setUserNotifCount((prev) => prev + 1);
      });
    }

    return () => {
      echo.leave('chat.' + user.id);
      echo.leave('notifications');
      if (user && user.is_admin) {
        echo.leave('admin-notifications');
      }
      if (user && !user.is_admin) {
        echo.leave('user-notifications');
      }
    };
  }, [user, token, chatOpen, selectedUser]);

  // عند فتح نافذة الدردشة، صفّر عداد الشارة العام
  useEffect(() => {
    if (chatOpen) setTotalUnreadMessages(0);
  }, [chatOpen]);

  // إرسال رسالة
  const handleAdminSend = async () => {
    setChatLoading(true);
    setChatError('');
    try {
      const formData = new FormData();
      formData.append('to_user_id', selectedUser!.toString());
      formData.append('message', chatInput);
      formData.append('is_urgent', chatUrgent ? 'true' : 'false');
      if (image) {
        formData.append('image', image);
      }
      if (file) {
        formData.append('file', file);
      }

      const res = await axiosInstance.post('/chat/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setChatMessages(prev => [...prev, res.data]);
      setChatInput('');
      setImage(null);
      setFile(null);
      setChatUrgent(false);
    } catch (err: any) {
      setChatError('خطأ في إرسال الرسالة: ' + (err.response?.data?.message || err.message));
    } finally {
      setChatLoading(false);
    }
  };

  // التمرير التلقائي عند تحديث الرسائل (فقط داخل منطقة الرسائل)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  // عداد الرسائل غير المقروءة
  useEffect(() => {
    if (selectedUser && chatMessages.length > 0) {
      const lastReadId = Number(localStorage.getItem('lastReadChatId_' + selectedUser) || 0);
      const unread = chatMessages.filter(msg => msg.id > lastReadId && msg.from_user_id === selectedUser).length;
      setUnreadCounts(prev => ({ ...prev, [selectedUser]: unread }));
    }
  }, [chatMessages, selectedUser]);

  // عند فتح دردشة مستخدم، اعتبر كل رسائل هذا المستخدم مقروءة
  useEffect(() => {
    if (chatOpen && selectedUser && chatMessages.length > 0) {
      const lastId = chatMessages[chatMessages.length - 1].id;
      localStorage.setItem('lastReadChatId_' + selectedUser, lastId);
      setUnreadCounts(prev => ({ ...prev, [selectedUser]: 0 }));
    }
  }, [chatOpen, selectedUser, chatMessages]);

  // جلب الرسائل وحساب unreadCounts لكل مستخدم عند تحميل الصفحة أو كل 5 ثوانٍ حتى لو لم تُفتح الدردشة
  useEffect(() => {
    let interval;
    const fetchUnreadCountsAndLastMessages = async () => {
      if (users && user && user.is_admin) {
        const counts: { [userId: number]: number } = {};
        const lastMsgs: { [userId: number]: any } = {};
        for (const u of users) {
          const res = await axiosInstance.get(`/chat/${u.id}`);
          const msgs = res.data;
          const lastReadId = Number(localStorage.getItem('lastReadChatId_' + u.id) || 0);
          const unread = msgs.filter((msg: any) => msg.id > lastReadId && msg.from_user_id === u.id).length;
          counts[u.id] = unread;
          if (msgs.length > 0) {
            lastMsgs[u.id] = msgs[msgs.length - 1];
          } else {
            lastMsgs[u.id] = null;
          }
        }
        setUnreadCounts(counts);
        setLastMessagesByUser(lastMsgs);
      }
    };
    fetchUnreadCountsAndLastMessages();
    interval = setInterval(fetchUnreadCountsAndLastMessages, 5000);
    return () => { if (interval) clearInterval(interval); };
  }, [users, user]);

  // احسب مجموع كل الرسائل غير المقروءة من جميع المستخدمين
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const [urgentUnread, setUrgentUnread] = useState(0);

  const [modalImage, setModalImage] = useState<string | null>(null);

  // تفعيل الصوت بعد أول تفاعل مع الصفحة (حل مشكلة autoplay)
  useEffect(() => {
    const enableAudio = () => {
      // شغّل صوت الرسالة بصوت منخفض (وليس صامت)
      const audio = new Audio('/message.mp3');
      audio.volume = 1; // يجب أن يكون الصوت مسموعًا
      audio.play().catch(() => {});
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('keydown', enableAudio);
    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
  }, []);

  // شغّل الرنة مع كل زيادة في مجموع الرسائل غير المقروءة (badge) للأدمن فقط عند الزيادة وليس عند فتح النافذة أو تغيير المستخدم
  const prevUnreadCounts = useRef<{ [userId: number]: number }>({});
  useEffect(() => {
    // شغّل الرنة فقط إذا زاد العداد لمستخدم معين ولم يتغير selectedUser
    let shouldPlay = false;
    Object.keys(unreadCounts).forEach(userId => {
      const prev = prevUnreadCounts.current[Number(userId)] || 0;
      const curr = unreadCounts[Number(userId)] || 0;
      // إذا زاد العداد لهذا المستخدم ولم يتغير selectedUser
      if (
        curr > prev &&
        Number(userId) !== selectedUser // لا تشغل الصوت إذا كان المستخدم المحدد هو نفسه
      ) {
        shouldPlay = true;
      }
    });
    if (shouldPlay) {
      // playMessageSound(); // Removed
    }
    prevUnreadCounts.current = { ...unreadCounts };
  }, [unreadCounts, selectedUser]);

  // عند أول تحميل فقط، جلب عدد الإشعارات غير المقروءة من API
  useEffect(() => {
    const fetchNotifCount = async () => {
      if (user && user.is_admin) {
        const res = await axiosInstance.get('/admin/notifications/unread-count');
        setNotifCount(res.data.count || 0);
      }
    };
    fetchNotifCount();
    
    // إزالة التحديث الدوري - التحديث سيحدث فقط عند التفاعل
  }, [user]);

  // استماع لحدث تحديث عداد الإشعارات من AdminNotifications
  useEffect(() => {
    const handleUpdateNotificationCount = async () => {
      if (user && user.is_admin) {
        const res = await axiosInstance.get('/admin/notifications/unread-count');
        setNotifCount(res.data.count || 0);
      }
    };

    window.addEventListener('updateNotificationCount', handleUpdateNotificationCount);
    return () => {
      window.removeEventListener('updateNotificationCount', handleUpdateNotificationCount);
    };
  }, [user]);

  // استماع لحدث تحديث عداد إشعارات المستخدم العادي
  useEffect(() => {
    const handleUpdateUserNotificationCount = async () => {
      if (user && !user.is_admin) {
        try {
          const res = await axiosInstance.get('/notifications');
          const notifs = Array.isArray(res.data) ? res.data : [];
          setUserNotifs(notifs);
          setUserNotifCount(notifs.filter(n => !n.is_read).length);
        } catch (error) {
          console.error('❌ خطأ في جلب إشعارات المستخدم:', error);
        }
      }
    };

    window.addEventListener('updateUserNotificationCount', handleUpdateUserNotificationCount);
    return () => {
      window.removeEventListener('updateUserNotificationCount', handleUpdateUserNotificationCount);
    };
  }, [user]);

  // 1. أضف useRef لتتبع آخر ID إشعار تم عرضه
  const lastNotifIdRef = useRef<number | null>(null);

  const [showNotifBubble, setShowNotifBubble] = useState(false);
  const [notifBubbleText, setNotifBubbleText] = useState('');
  const notifBubbleTimeout = useRef<NodeJS.Timeout | null>(null);

  // عند استقبال إشعار جديد عبر WebSocket، أظهر الفقاعة
  useEffect(() => {
    if (!user || !token) return;
    const echo = createEcho(token);
    if (!echo) return;
    const notifChannel = echo.channel('notifications');
    notifChannel.listen('NewNotification', (data: any) => {
      const notifId = data?.notification?.id || data?.id;
      const notifTitle = data?.notification?.title_ar || data?.notification?.title_fr || data?.title || 'إشعار جديد';
      if (notifId && notifId !== lastNotifIdRef.current) {
        lastNotifIdRef.current = notifId;
        // تحديث العداد فوراً
        setNotifCount((prev) => prev + 1);
        setNotifBubbleText(notifTitle);
        setShowNotifBubble(true);
        if (notifBubbleTimeout.current) clearTimeout(notifBubbleTimeout.current);
        notifBubbleTimeout.current = setTimeout(() => setShowNotifBubble(false), 5000);
      }
    });
    return () => {
      echo.leave('notifications');
      if (notifBubbleTimeout.current) clearTimeout(notifBubbleTimeout.current);
    };
  }, [user, token]);

  // شغّل صوت الإشعار فقط عند زيادة العدد
  const prevNotifCount = useRef(notifCount);
  useEffect(() => {
    if (notifCount > prevNotifCount.current) {
      // playNotificationSound(); // Removed
    }
    prevNotifCount.current = notifCount;
  }, [notifCount]);

  // دالة تعرض معلومات النوع (أيقونة/لون/نص)
  const getTypeInfo = (type: string) => {
    const types = {
      workCertificate: { ar: 'شهادة عمل', fr: 'Certificat de travail', color: 'blue' },
      vacationRequest: { ar: 'طلب إجازة', fr: 'Demande de congé', color: 'green' },
      missionOrder: { ar: 'أمر مهمة', fr: 'Ordre de mission', color: 'purple' },
      salaryDomiciliation: { ar: 'توطين الراتب', fr: 'Domiciliation de salaire', color: 'orange' },
      annualIncome: { ar: 'الدخل السنوي', fr: 'Revenu annuel', color: 'red' },
    };
    return types[type as keyof typeof types] || { ar: type, fr: type, color: 'gray' };
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return '📄';
    if (fileType === 'doc' || fileType === 'docx') return '📝';
    if (fileType === 'txt') return '📄';
    return '📎';
  };

  // --- أضف في الأعلى ---
  // --- أبقِ دوال الألوان فقط ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-700';
      case 'rejected':
        return 'text-red-700';
      case 'waiting_admin_file':
        return 'text-orange-600';
      default:
        return 'text-blue-700';
    }
  };
  const getTypeBadge = (type: string, language: string) => {
    switch (type) {
      case 'workCertificate':
        return { label: language === 'ar' ? 'شهادة عمل' : 'Attestation de Travail', color: 'bg-green-100 text-green-700' };
      case 'vacationRequest':
        return { label: language === 'ar' ? 'طلب إجازة' : 'Demande de Congé', color: 'bg-blue-100 text-blue-700' };
      case 'missionOrder':
        return { label: language === 'ar' ? 'أمر مهمة' : 'Ordre de Mission', color: 'bg-purple-100 text-purple-700' };
      case 'salaryDomiciliation':
        return { label: language === 'ar' ? 'توطين الراتب' : 'Domiciliation de Salaire', color: 'bg-cyan-100 text-cyan-700' };
      case 'annualIncome':
        return { label: language === 'ar' ? 'دخل سنوي' : 'Revenu Annuel', color: 'bg-orange-100 text-orange-700' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };
  const getStatusText = (status: string, language: string, requestType?: string) => {
    const requestTypeName = requestType || '';
    switch (status) {
      case 'approved':
        return language === 'ar' 
          ? `تم قبول ${requestTypeName} بنجاح. سيتم تجهيز الملف قريبًا.`
          : `${requestTypeName} a été acceptée avec succès. Le fichier sera prêt bientôt.`;
      case 'rejected':
        return language === 'ar' 
          ? `تم رفض ${requestTypeName} بسبب نقص أو خطأ في الملف. يمكنك إعادة الطلب.`
          : `${requestTypeName} a été rejetée car elle est incomplète ou ne répond pas aux critères. Vous pouvez réessayer.`;
      case 'waiting_admin_file':
        return language === 'ar' 
          ? `تمت الموافقة على ${requestTypeName} جزئيًا. انتظر ملف الإدارة.`
          : `${requestTypeName} a été partiellement acceptée. Attendez le fichier de l'admin.`;
      default:
        return language === 'ar' 
          ? `${requestTypeName} قيد المراجعة. سيتم إعلامك عند تحديث الحالة.`
          : `${requestTypeName} est en cours de traitement. Vous serez notifié lors de la mise à jour.`;
    }
  };

  // دالة مساعدة للحصول على عنوان الإشعار للمستخدم
  function getUserNotifTitle(notif: any, language: string): string {
    // 1. إذا كان notif.type هو نوع الطلب الحقيقي
    const typeMap: any = {
      workCertificate: language === 'ar' ? 'شهادة عمل' : 'Attestation de travail',
      vacationRequest: language === 'ar' ? 'طلب إجازة' : 'Demande de congé',
      missionOrder: language === 'ar' ? 'أمر مهمة' : 'Ordre de mission',
      salaryDomiciliation: language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire',
      annualIncome: language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels',
    };
    if (notif.type && typeMap[notif.type]) {
      return typeMap[notif.type];
    }

    // 2. إذا كان notif.data يحتوي *_id استنتج نوع الطلب
    if (notif.data) {
      try {
        const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
        if (data) {
          if (data.certificate_id) return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
          if (data.vacation_request_id) return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
          if (data.mission_order_id) return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
          if (data.salary_domiciliation_id) return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
          if (data.annual_income_id) return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';
        }
      } catch (e) {}
    }

    // 3. محاولة استخراج نوع الطلب من body_ar أو title_ar
    const body = (language === 'ar' ? notif.body_ar : notif.body_fr) || '';
    const title = (language === 'ar' ? notif.title_ar : notif.title_fr) || '';
    if (body.includes('شهادة عمل') || title.includes('شهادة عمل')) return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
    if (body.includes('توطين الراتب') || title.includes('توطين الراتب')) return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
    if (body.includes('طلب إجازة') || title.includes('طلب إجازة')) return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
    if (body.includes('أمر مهمة') || title.includes('أمر مهمة')) return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
    if (body.includes('شهادة دخل سنوي') || title.includes('شهادة دخل سنوي')) return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';

    // 4. إذا لم يوجد نوع طلب، أظهر نص الحالة
    const status = notif.status || notif.request_status || notif.type;
    switch (status) {
      case 'accepted':
      case 'approved':
        return language === 'ar' ? 'طلب مقبول' : 'Demande acceptée';
      case 'rejected':
      case 'refused':
        return language === 'ar' ? 'طلب مرفوض' : 'Demande refusée';
      case 'waiting_admin_file':
        return language === 'ar' ? 'بانتظار ملف الإدارة' : "En attente du fichier de l'admin";
      case 'pending':
      case 'submitted':
        return language === 'ar' ? 'طلب قيد المراجعة' : 'Demande en cours';
      case 'processing':
        return language === 'ar' ? 'طلب قيد المعالجة' : 'Demande en traitement';
      case 'completed':
        return language === 'ar' ? 'طلب مكتمل' : 'Demande complétée';
      case 'cancelled':
        return language === 'ar' ? 'طلب ملغى' : 'Demande annulée';
      case 'on_hold':
        return language === 'ar' ? 'طلب موقوف مؤقتاً' : 'Demande en attente';
      default:
        return language === 'ar' ? 'طلب' : 'Demande';
    }
  }

  // دالة اللون للعناوين - تستخدم الأزرق دائماً لأن العناوين الآن هي أسماء أنواع الطلبات
  function getNotifTitleColorUser(notif: any, language: string) {
    const status = (notif.status || notif.request_status || notif.type || '').toLowerCase();
    if (status === 'pending') return 'text-gray-500';
    if (
      status === 'approved' ||
      status === 'file_ready' ||
      status === 'file_accepted' ||
      status === 'file_uploaded' ||
      (notif.body_ar?.includes('تم تجهيز ملفك') || notif.body_fr?.includes('Votre fichier a été accepté'))
    ) return 'text-green-600';
    if (status === 'rejected') return 'text-red-600';
    if (status === 'waiting_admin_file') return 'text-yellow-600';
    return 'text-blue-700';
  }

  // دالة مساعدة لتحديد إذا كان العنوان يمثل نوع الطلب
  function isTypeTitle(title: string, language: string) {
    const typeTitles = [
      'Attestation de travail', 'Demande de congé', 'Ordre de mission', 'Domiciliation de salaire', 'Attestation de revenus annuels',
      'شهادة عمل', 'طلب إجازة', 'أمر مهمة', 'توطين الراتب', 'شهادة دخل سنوي'
    ];
    return typeTitles.includes(title);
  }

  // دالة مساعدة لاستخراج نوع الطلب من الإشعار
  function extractRequestType(notif: any): string | null {
    // فحص notif.data أولاً
    if (notif.data) {
      try {
        const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
        if (data.request_type) {
          return data.request_type;
        }
        if (data.type) {
          return data.type;
        }
        if (data.request_type_id) {
          return data.request_type_id;
        }
        if (data.type_id) {
          return data.type_id;
        }
      } catch (e) {
        console.error('Error parsing notification data:', e);
      }
    }
    
    // فحص notif.type مباشرة
    if (notif.type) {
      const typeMap: any = {
        workCertificate: 'workCertificate',
        vacationRequest: 'vacationRequest', 
        missionOrder: 'missionOrder',
        salaryDomiciliation: 'salaryDomiciliation',
        annualIncome: 'annualIncome',
        work_certificates: 'workCertificate',
        vacation_requests: 'vacationRequest',
        mission_orders: 'missionOrder',
        salary_domiciliations: 'salaryDomiciliation',
        annual_incomes: 'annualIncome',
        // إضافة أنواع إضافية لإشعارات إضافة الملفات
        'file_upload_work_certificates': 'workCertificate',
        'file_upload_vacation_requests': 'vacationRequest',
        'file_upload_mission_orders': 'missionOrder',
        'file_upload_salary_domiciliations': 'salaryDomiciliation',
        'file_upload_annual_incomes': 'annualIncome',
        // إضافة أنواع إضافية لإشعارات إضافة الملفات
        'file_ready_work_certificates': 'workCertificate',
        'file_ready_vacation_requests': 'vacationRequest',
        'file_ready_mission_orders': 'missionOrder',
        'file_ready_salary_domiciliations': 'salaryDomiciliation',
        'file_ready_annual_incomes': 'annualIncome',
        // إضافة أنواع إضافية لإشعارات إضافة الملفات
        'admin_file_upload_work_certificates': 'workCertificate',
        'admin_file_upload_vacation_requests': 'vacationRequest',
        'admin_file_upload_mission_orders': 'missionOrder',
        'admin_file_upload_salary_domiciliations': 'salaryDomiciliation',
        'admin_file_upload_annual_incomes': 'annualIncome',
        // إضافة أنواع إضافية لإشعارات approved
        'approved_work_certificates': 'workCertificate',
        'approved_vacation_requests': 'vacationRequest',
        'approved_mission_orders': 'missionOrder',
        'approved_salary_domiciliations': 'salaryDomiciliation',
        'approved_annual_incomes': 'annualIncome',
        // إضافة أنواع إضافية لإشعارات approved
        'file_accepted_work_certificates': 'workCertificate',
        'file_accepted_vacation_requests': 'vacationRequest',
        'file_accepted_mission_orders': 'missionOrder',
        'file_accepted_salary_domiciliations': 'salaryDomiciliation',
        'file_accepted_annual_incomes': 'annualIncome',
        // إضافة أنواع إضافية لإشعارات waiting_admin_file
        'waiting_admin_file': null // سنستخرج النوع من body_ar/body_fr
      };
      
      // إذا كان النوع معروف، استخدمه
      if (typeMap[notif.type] && typeMap[notif.type] !== null) {
        return typeMap[notif.type];
      }
      
      // إذا كان النوع waiting_admin_file، استخرج النوع من body_ar/body_fr
      if (notif.type === 'waiting_admin_file') {
        const bodyAr = notif.body_ar || '';
        const bodyFr = notif.body_fr || '';
        
        // البحث عن نوع الطلب في النص العربي
        if (bodyAr.includes('نوع الطلب: work_certificates')) {
          return 'workCertificate';
        }
        if (bodyAr.includes('نوع الطلب: vacation_requests')) {
          return 'vacationRequest';
        }
        if (bodyAr.includes('نوع الطلب: mission_orders')) {
          return 'missionOrder';
        }
        if (bodyAr.includes('نوع الطلب: salary_domiciliations')) {
          return 'salaryDomiciliation';
        }
        if (bodyAr.includes('نوع الطلب: annual_incomes')) {
          return 'annualIncome';
        }
        
        // البحث عن نوع الطلب في النص الفرنسي
        if (bodyFr.includes('Type de demande: work_certificates')) {
          return 'workCertificate';
        }
        if (bodyFr.includes('Type de demande: vacation_requests')) {
          return 'vacationRequest';
        }
        if (bodyFr.includes('Type de demande: mission_orders')) {
          return 'missionOrder';
        }
        if (bodyFr.includes('Type de demande: salary_domiciliations')) {
          return 'salaryDomiciliation';
        }
        if (bodyFr.includes('Type de demande: annual_incomes')) {
          return 'annualIncome';
        }
      }
      
      return notif.type;
    }
    
    // فحص body_ar و body_fr للبحث عن "نوع الطلب:"
    const bodyAr = notif.body_ar || '';
    const bodyFr = notif.body_fr || '';
    
    // البحث عن نوع الطلب في النص العربي
    if (bodyAr.includes('نوع الطلب: work_certificates')) {
      return 'workCertificate';
    }
    if (bodyAr.includes('نوع الطلب: vacation_requests')) {
      return 'vacationRequest';
    }
    if (bodyAr.includes('نوع الطلب: mission_orders')) {
      return 'missionOrder';
    }
    if (bodyAr.includes('نوع الطلب: salary_domiciliations')) {
      return 'salaryDomiciliation';
    }
    if (bodyAr.includes('نوع الطلب: annual_incomes')) {
      return 'annualIncome';
    }
    
    // البحث عن نوع الطلب في النص الفرنسي
    if (bodyFr.includes('Type de demande: work_certificates')) {
      return 'workCertificate';
    }
    if (bodyFr.includes('Type de demande: vacation_requests')) {
      return 'vacationRequest';
    }
    if (bodyFr.includes('Type de demande: mission_orders')) {
      return 'missionOrder';
    }
    if (bodyFr.includes('Type de demande: salary_domiciliations')) {
      return 'salaryDomiciliation';
    }
    if (bodyFr.includes('Type de demande: annual_incomes')) {
      return 'annualIncome';
    }
    
    // البحث عن نوع الطلب في النص العربي لإشعارات إضافة الملفات (بدون تحديد نوع)
    if (bodyAr.includes('تم تجهيز ملفك')) {
      // محاولة استخراج نوع الطلب من النص
      if (bodyAr.includes('شهادة عمل') || bodyAr.includes('work_certificates')) {
        return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
      }
      if (bodyAr.includes('طلب إجازة') || bodyAr.includes('vacation_requests')) {
        return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
      }
      if (bodyAr.includes('أمر مهمة') || bodyAr.includes('mission_orders')) {
        return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
      }
      if (bodyAr.includes('توطين الراتب') || bodyAr.includes('salary_domiciliations')) {
        return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
      }
      if (bodyAr.includes('شهادة دخل سنوي') || bodyAr.includes('annual_incomes')) {
        return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';
      }
    }
    
    // البحث عن نوع الطلب في النص الفرنسي لإشعارات إضافة الملفات (بدون تحديد نوع)
    if (bodyFr.includes('Votre fichier a été accepté')) {
      // محاولة استخراج نوع الطلب من النص
      if (bodyFr.includes('Attestation de travail') || bodyFr.includes('work_certificates')) {
        return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
      }
      if (bodyFr.includes('Demande de congé') || bodyFr.includes('vacation_requests')) {
        return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
      }
      if (bodyFr.includes('Ordre de mission') || bodyFr.includes('mission_orders')) {
        return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
      }
      if (bodyFr.includes('Domiciliation de salaire') || bodyFr.includes('salary_domiciliations')) {
        return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
      }
      if (bodyFr.includes('Attestation de revenus annuels') || bodyFr.includes('annual_incomes')) {
        return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';
      }
    }
    
    // البحث عن نوع الطلب في النص العربي لإشعارات approved
    if (bodyAr.includes('تم قبول طلبك')) {
      // محاولة استخراج نوع الطلب من النص
      if (bodyAr.includes('شهادة عمل') || bodyAr.includes('work_certificates')) {
        return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
      }
      if (bodyAr.includes('طلب إجازة') || bodyAr.includes('vacation_requests')) {
        return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
      }
      if (bodyAr.includes('أمر مهمة') || bodyAr.includes('mission_orders')) {
        return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
      }
      if (bodyAr.includes('توطين الراتب') || bodyAr.includes('salary_domiciliations')) {
        return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
      }
      if (bodyAr.includes('شهادة دخل سنوي') || bodyAr.includes('annual_incomes')) {
        return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';
      }
    }
    
    // البحث عن نوع الطلب في النص الفرنسي لإشعارات approved
    if (bodyFr.includes('Votre fichier a été accepté')) {
      // محاولة استخراج نوع الطلب من النص
      if (bodyFr.includes('Attestation de travail') || bodyFr.includes('work_certificates')) {
        return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
      }
      if (bodyFr.includes('Demande de congé') || bodyFr.includes('vacation_requests')) {
        return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
      }
      if (bodyFr.includes('Ordre de mission') || bodyFr.includes('mission_orders')) {
        return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
      }
      if (bodyFr.includes('Domiciliation de salaire') || bodyFr.includes('salary_domiciliations')) {
        return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
      }
      if (bodyFr.includes('Attestation de revenus annuels') || bodyFr.includes('annual_incomes')) {
        return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';
      }
    }
    
    // إذا لم تجد نوع الطلب، استخدم العنوان الافتراضي
    return (language === 'ar' ? 'طلب جديد' : 'Nouvelle demande');
  }

  // دالة توليد رابط الصورة بشكل آمن (مثل UrgentChatButton)
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

  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  // تحديث فوري عند التفاعل مع الصفحة
  useEffect(() => {
    let lastUpdate = 0;
    const UPDATE_THROTTLE = 2000; // تحديث كل ثانيتين كحد أقصى

    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastUpdate < UPDATE_THROTTLE) return; // تجنب التحديث المتكرر
      lastUpdate = now;

      // تحديث إشعارات الأدمن
      if (user && user.is_admin) {
        axiosInstance.get('/admin/notifications/unread-count')
          .then(res => setNotifCount(res.data.count || 0))
          .catch(err => console.error('❌ خطأ في تحديث إشعارات الأدمن:', err));
      }
      
      // تحديث إشعارات المستخدم العادي
      if (user && !user.is_admin) {
        axiosInstance.get('/notifications')
          .then(res => {
            const notifs = Array.isArray(res.data) ? res.data : [];
            setUserNotifs(notifs);
            setUserNotifCount(notifs.filter(n => !n.is_read).length);
          })
          .catch(err => console.error('❌ خطأ في تحديث إشعارات المستخدم:', err));
      }
    };

    // تحديث عند العودة للصفحة
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleUserInteraction();
      }
    };

    // تحديث عند تحميل الصفحة
    const handlePageLoad = () => {
      handleUserInteraction();
    };

    // إضافة مستمعي الأحداث للتفاعل (فقط الأحداث المهمة)
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('focus', handleUserInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('load', handlePageLoad);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('focus', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('load', handlePageLoad);
    };
  }, [user]);

  // دالة توليد النص المحسن لإشعارات المستخدم العادي حسب الحالة
  const getUserNotificationText = (notif: any, language: string) => {
    const title = (language === 'ar' ? notif.title_ar : notif.title_fr) || '';
    const status = notif.status || notif.request_status || 'pending';
    
    // فحص النصوص المحددة أولاً
    if (/تم تجهيز ملفك من الإدارة|votre fichier est prêt/i.test(title)) {
      return language === 'ar' ? 'تم قبول ملفك ويمكنك تحميله من صفحة جميع الطلبات.' : 'Votre fichier a été accepté. Vous pouvez le télécharger depuis la page de toutes les demandes.';
    }
    
    if (/تم قبول طلبك، بانتظار رفع ملف الإدارة|acceptée, en attente du fichier/i.test(title)) {
      return language === 'ar' ? 'تمت الموافقة، انتظر ملف الإدارة.' : "En attente du fichier de l'admin.";
    }
    
    if (/تم رفض طلبك|refusée/i.test(title)) {
      return language === 'ar' ? 'تم الرفض بسبب نقص أو خطأ في الملف. يمكنك إعادة الطلب.' : 'Refusé pour dossier incomplet ou erreur. Vous pouvez refaire la demande.';
    }
    
    if (/تم حفظ شهادة العمل بنجاح|sauvegardée avec succès/i.test(title)) {
      return language === 'ar' ? 'تم إرسال الطلب وهو قيد المراجعة من الإدارة.' : "Votre demande a été envoyée et est en cours de révision par l'administration.";
    }
    
    // النص حسب الحالة
    switch (status) {
      case 'approved':
      case 'accepted':
        return language === 'ar' ? 'تم قبول طلبك بنجاح.' : 'Votre demande a été acceptée avec succès.';
        
      case 'rejected':
      case 'refused':
        return language === 'ar' ? 'تم رفض طلبك. يمكنك إعادة المحاولة.' : 'Votre demande a été refusée. Vous pouvez réessayer.';
        
      case 'waiting_admin_file':
        return language === 'ar' ? 'تم قبول طلبك، بانتظار ملف الإدارة.' : 'Votre demande a été acceptée, en attente du fichier de l\'admin.';
        
      case 'pending':
      case 'submitted':
        return language === 'ar' ? 'طلبك قيد المراجعة من الإدارة.' : 'Votre demande est en cours de révision par l\'administration.';
        
      case 'processing':
        return language === 'ar' ? 'طلبك قيد المعالجة.' : 'Votre demande est en cours de traitement.';
        
      case 'completed':
        return language === 'ar' ? 'تم إنجاز طلبك بنجاح.' : 'Votre demande a été complétée avec succès.';
        
      case 'cancelled':
        return language === 'ar' ? 'تم إلغاء طلبك.' : 'Votre demande a été annulée.';
        
      case 'on_hold':
        return language === 'ar' ? 'طلبك متوقف مؤقتاً.' : 'Votre demande est en attente.';
        
      default:
        return language === 'ar' ? 'طلبك قيد المراجعة من الإدارة.' : 'Votre demande est en cours de révision par l\'administration.';
    }
  };

  return (
    <header className={cn(
      "bg-white/95 backdrop-blur-sm border-b border-slate-200/50 py-3 px-4 md:px-6 flex items-center justify-between shadow-sm",
      "relative z-20 h-16 md:h-20"
    )}>
      <div className="flex-grow max-w-lg mx-auto">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder={t('search')}
            className="cmc-input pl-4 pr-10 h-9 md:h-10 text-sm"
          /> 
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        <LanguageSwitcher />
        {/* جرس إشعارات المستخدم العادي */}
        {user && !user.is_admin && (
          <DropdownMenu onOpenChange={handleUserNotifOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-cmc-blue-light/50 text-cmc-blue h-9 w-9 md:h-10 md:w-10">
                <Bell size={16} />
                {userNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cmc-blue to-cmc-green text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center shadow">
                    {userNotifCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96 cmc-card p-0">
              <div style={{height: 500, minWidth: 380, maxHeight: '90vh'}} className="flex flex-col">
                <h4 className="font-semibold text-slate-800 mb-2 px-4 pt-3">{t('notifications')}</h4>
                {userNotifs.length === 0 && <div className="text-gray-500 px-4">لا توجد إشعارات جديدة.</div>}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {userNotifs.slice(0, visibleUserNotifCount).map((notif, idx) => {
                    const requestType = extractRequestType(notif);
                    const requestTypeName = getUserNotifTitle(notif, language);
                    const status = notif.status || notif.request_status || 'pending';
                    
                    return (
                      <div key={notif.id || idx} className={`rounded p-2 mb-1 ${notif.is_read ? '' : 'bg-cmc-blue-light/20'} min-h-0`}>
                        {/* عنوان الإشعار: اسم نوع الطلب بلون الحالة */}
                        <div className={`font-bold text-sm ${getNotifTitleColorUser(notif, language)} break-words`}>
                          {requestTypeName}
                        </div>
                        {/* نص الإشعار المحسن حسب الحالة مع اسم نوع الطلب */}
                        <div className="text-xs text-gray-700 mt-1 break-words leading-relaxed">
                          {getUserNotificationText(notif, language)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 break-words">{new Date(notif.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'fr-FR')}</div>
                      </div>
                    );
                  })}
                </div>
                {userNotifs.length > visibleUserNotifCount && (
                  <button
                    className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded-b"
                    onClick={() => setVisibleUserNotifCount(userNotifs.length)}
                  >
                    {language === 'ar' ? 'عرض المزيد' : 'Afficher plus'}
                  </button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* جرس إشعارات الأدمن */}
        {user && user.is_admin && (
          <>
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative hover:bg-cmc-blue-light/50 text-cmc-blue h-9 w-9 md:h-10 md:w-10" onClick={() => setChatOpen(v => !v)} title="دردشة مع المستخدمين">
                <MessageCircle size={18} />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cmc-blue to-cmc-green text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center shadow">
                    {totalUnread}
                  </span>
                )}
              </Button>
              {chatOpen && (
                <div className="absolute right-0 mt-2 w-[600px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[10000] animate-fade-in">
                  <div
                    ref={containerRef}
                    className="w-full h-[70vh] flex flex-col md:flex-row overflow-hidden relative"
                  >
                    <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl z-10" onClick={() => setChatOpen(false)}><X /></button>
                    {/* قائمة المستخدمين */}
                    <div
                      className="border-r bg-gray-50 h-full flex flex-col"
                      style={{ width: sidebarWidth, minWidth: 140, maxWidth: 400 }}
                    >
                      <div className="p-3 border-b">
                        <input type="text" placeholder={language === 'fr' ? 'Rechercher un utilisateur...' : 'بحث عن مستخدم...'} value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {users
                          .filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
                          // الترتيب: الأحدث أولاً (حسب تاريخ آخر رسالة محفوظة في lastMessagesByUser)
                          .sort((a, b) => {
                            const aMsg = lastMessagesByUser[a.id];
                            const bMsg = lastMessagesByUser[b.id];
                            if (!aMsg && !bMsg) return 0;
                            if (!aMsg) return 1;
                            if (!bMsg) return -1;
                            return new Date(bMsg.created_at).getTime() - new Date(aMsg.created_at).getTime();
                          })
                          .map(u => {
                            const lastMsg = lastMessagesByUser[u.id];
                            const lastTime = lastMsg ? formatTime(lastMsg.created_at, language) : '';
                            return (
                              <div key={u.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-100 ${selectedUser === u.id ? 'bg-blue-200' : ''}`} onClick={() => setSelectedUser(u.id)}>
                                <Avatar className="w-9 h-9">
                                  <AvatarImage src={u.profile_photo_url} alt={u.name} />
                                  <AvatarFallback className="text-xs">{u.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-bold text-sm">{u.name}</div>
                                  <div className="text-xs text-gray-500">{u.email}</div>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                  {unreadCounts[u.id] > 0 && (
                                    <span className="bg-gradient-to-r from-cmc-blue to-cmc-green text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center mb-1">{unreadCounts[u.id]}</span>
                                  )}
                                  {lastTime && <span className="text-[11px] text-gray-400">{lastTime}</span>}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    {/* الفاصل القابل للسحب */}
                    <div
                      style={{
                        cursor: 'col-resize',
                        width: 12,
                        background: isResizing ? '#60a5fa' : '#e5e7eb', // أزرق عند السحب
                        zIndex: 100,
                        transition: 'background 0.2s',
                      }}
                      onMouseDown={startResizing}
                      title={language === 'fr' ? 'Redimensionner' : 'تغيير العرض'}
                      onClick={e => e.stopPropagation()}
                    />
                    {/* نافذة المحادثة */}
                    <div className="flex-1 flex flex-col h-full bg-white">
                      {selectedUser ? (
                        <div className="flex flex-col h-full">
                          <div className="border-b p-3 font-bold bg-gray-100">{language === 'fr' ? 'Discussion avec' : 'محادثة مع'} {users.find(u => u.id === selectedUser)?.name}</div>
                          {/* في منطقة الرسائل: */}
                          <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto px-3 py-0 space-y-2 bg-gray-50"
                            style={{ minHeight: 120 }}
                          >
                            {chatMessages.length === 0 && (
                              <div className="text-gray-400 text-center mt-10">{language === 'fr' ? 'Aucun message' : 'لا توجد رسائل بعد'}</div>
                            )}
                            {chatMessages.map((msg, idx) => (
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
                                    {modalImage && (
                                      <div
                                        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => setModalImage(null)}
                                      >
                                        <button
                                          style={{ position: 'absolute', top: 24, right: 32, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 24, cursor: 'pointer', zIndex: 10000 }}
                                          onClick={e => { e.stopPropagation(); setModalImage(null); }}
                                          aria-label="إغلاق الصورة"
                                        >✕</button>
                                        <img
                                          src={modalImage}
                                          alt="chat-img-large"
                                          style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 0 20px #0008', background: '#fff', display: 'block' }}
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
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
                                    <div className={`text-[11px] text-gray-500 mt-1 ${msg.from_user_id === user.id ? 'text-left' : 'text-right'}`}>{formatTime(msg.created_at, language)}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                          <form className="flex gap-1 items-center p-1 border-t bg-white rounded-b-2xl" onSubmit={e => { e.preventDefault(); handleAdminSend(); }}>
                            {/* زر إضافة صورة */}
                            <label htmlFor="chat-image-input" className="cursor-pointer p-1 hover:bg-gray-100 rounded">
                              <ImageIcon className="text-gray-400 hover:text-gray-600" size={20} />
                            </label>
                            <input
                              type="file"
                              id="chat-image-input"
                              accept="image/*"
                              className="hidden"
                              onChange={e => setImage(e.target.files?.[0] || null)}
                            />
                            {/* زر إضافة ملف */}
                            <label htmlFor="chat-file-input" className="cursor-pointer p-1 hover:bg-gray-100 rounded">
                              <FileText className="text-gray-400 hover:text-gray-600" size={20} />
                            </label>
                            <input
                              type="file"
                              id="chat-file-input"
                              accept=".pdf,.doc,.docx,.txt"
                              className="hidden"
                              onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                            {/* عرض الصورة المختارة */}
                            {image && (
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt="preview"
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setImage(null)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            {/* عرض الملف المختار */}
                            {file && (
                              <div className="relative">
                                <div className="w-8 h-8 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                                  <span className="text-sm">{getFileIcon(file.name.split('.').pop() || '')}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setFile(null)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            <Input
                              placeholder={t('send_message')}
                              className="cmc-input pl-2 pr-10 h-9 md:h-10 text-sm"
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              disabled={chatLoading}
                            />
                            <Button type="submit" className="p-2" disabled={chatLoading}>
                              <Send size={20} />
                            </Button>
                          </form>
                          {chatError && <div className="text-red-600 mt-1 text-center text-xs">{chatError}</div>}
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center justify-center text-gray-400 text-lg">{language === 'fr' ? 'Sélectionnez un utilisateur pour commencer la discussion' : 'اختر مستخدمًا لبدء المحادثة'}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DropdownMenu open={notifOpen} onOpenChange={handleNotifOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-cmc-blue-light/50 text-cmc-blue h-9 w-9 md:h-10 md:w-10" title="الإشعارات">
                  <Bell size={18} />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cmc-blue to-cmc-green text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center shadow">
                      {notifCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 md:w-80 cmc-card">
                <AdminNotifications />
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      {showNotifBubble && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: '#2563eb',
            color: 'white',
            borderRadius: 32,
            boxShadow: '0 4px 24px #0002',
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 18,
            minWidth: 180,
            maxWidth: 340
          }}
          onClick={() => setShowNotifBubble(false)}
        >
          <Bell size={22} style={{marginLeft: 12, flexShrink: 0}} />
          <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{notifBubbleText}</span>
        </div>
      )}
    </header>
  );
};

function formatTime(dateString: string, language: string) {
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