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
import { playMessageSound, playNotificationSound } from '../utils/sounds';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
        setNotifCount(res.data.count || 0);
      }
    };
    fetchNotifCount();
  }, [user]);

  // عند فتح القائمة، اعتبر كل الإشعارات مقروءة في backend
  const handleNotifOpenChange = (open: boolean) => {
    setNotifOpen(open);
    if (open && user && user.is_admin) {
      axiosInstance.post('/admin/notifications/mark-all-read').then(() => {
        setNotifCount(0);
      });
    }
  };

  // إشعارات المستخدم العادي
  useEffect(() => {
    if (user && !user.is_admin) {
      // جلب الإشعارات فوراً عند تحميل الصفحة
      const fetchInitialNotifications = async () => {
        try {
          const res = await import('@/components/Api/axios').then(m => m.default.get('/notifications'));
          const notifs = Array.isArray(res.data) ? res.data : [];
          setUserNotifs(notifs);
          
          // حساب عدد الإشعارات غير المقروءة
          const unreadCount = notifs.filter(n => !n.is_read).length;
          setUserNotifCount(unreadCount);
          
          // تحديث إضافي من API للتأكد من الدقة
          setTimeout(async () => {
            try {
              const countRes = await import('@/components/Api/axios').then(m => m.default.get('/notifications/unread-count'));
              const apiCount = countRes.data.count || 0;
              setUserNotifCount(apiCount);
            } catch (error) {
              console.error('Error fetching initial count:', error);
            }
          }, 500);
        } catch (error) {
          console.error('Error fetching initial notifications:', error);
        }
      };

      fetchInitialNotifications();
    }
  }, [user]);

  // تحديث عداد الإشعارات تلقائياً كل 30 ثانية بدلاً من كل ثانية (تحسين كبير للأداء)
  useEffect(() => {
    if (user && !user.is_admin && !userNotifOpen) {
      const fetchNotifCount = async () => {
        try {
          const res = await import('@/components/Api/axios').then(m => m.default.get('/notifications/unread-count'));
          setUserNotifCount(res.data.count || 0);
        } catch (error) {
          console.error('Error fetching notification count:', error);
        }
      };

      // جلب العداد فوراً
      fetchNotifCount();

      // تحديث كل 30 ثانية بدلاً من كل ثانية (تحسين كبير للأداء)
      const interval = setInterval(fetchNotifCount, 30000);

      return () => clearInterval(interval);
    }
  }, [user, userNotifOpen]);

  // تحديث قائمة الإشعارات تلقائياً كل 60 ثانية بدلاً من كل ثانية (تحسين كبير للأداء)
  useEffect(() => {
    if (user && !user.is_admin && !userNotifOpen) {
      const fetchNotifList = async () => {
        try {
          const res = await import('@/components/Api/axios').then(m => m.default.get('/notifications'));
          const notifs = Array.isArray(res.data) ? res.data : [];
          setUserNotifs(notifs);
        } catch (error) {
          console.error('Error fetching notification list:', error);
        }
      };

      // جلب القائمة فوراً
      fetchNotifList();

      // تحديث كل 60 ثانية بدلاً من كل ثانية (تحسين كبير للأداء)
      const interval = setInterval(fetchNotifList, 60000);

      return () => clearInterval(interval);
    }
  }, [user, userNotifOpen]);

  const handleUserNotifOpenChange = (open: boolean) => {
    setUserNotifOpen(open);
    if (open && user && !user.is_admin) {
      // جلب الإشعارات الجديدة فوراً عند فتح النافذة
      const fetchNotificationsImmediately = async () => {
        try {
          const res = await import('@/components/Api/axios').then(m => m.default.get('/notifications'));
          const notifs = Array.isArray(res.data) ? res.data : [];
          setUserNotifs(notifs);
          
          // لا نعيد تعيين العداد هنا، فقط نحدث القائمة
          // العداد سيتم تحديثه من خلال WebSocket أو API polling
          
          // تعليم الإشعارات كمقروءة بعد جلبها
          await import('@/components/Api/axios').then(m => m.default.post('/notifications/read-all'));
          setUserNotifCount(0);
          setUserNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      fetchNotificationsImmediately();
    }
  };

  // جلب الرسائل عند اختيار مستخدم (تعديل المسار + polling محسن)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchMessages = () => {
      if (chatOpen && selectedUser) {
        axiosInstance.get(`/chat/${selectedUser}`).then(res => setChatMessages(res.data));
      }
    };
    fetchMessages();
    if (chatOpen && selectedUser) {
      // تحديث كل 5 ثوانٍ بدلاً من كل ثانية (تحسين الأداء)
      interval = setInterval(fetchMessages, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [chatOpen, selectedUser]);

  // عداد الرسائل غير المقروءة العام (لكل الرسائل)
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  useEffect(() => {
    let echoInstance: any = null;
    (async () => {
      const storedToken = localStorage.getItem('token');
      if (!user || !storedToken) {
        if (user && !storedToken && process.env.NODE_ENV === 'development') {
          console.warn('No auth token found for Echo!');
        }
        return;
      }
      const echo = createEcho(storedToken);
      if (!echo) return;
      echoInstance = echo;
      // استمع لرسائل الدردشة (حتى لو لم تكن نافذة الدردشة مفتوحة)
      const chatChannel = echo.private('chat.' + user.id);
      chatChannel.listen('NewChatMessage', (data: any) => {
        if (data.message.from_user_id !== user.id) {
          playMessageSound();
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
      notifChannel.listen('NewNotification', () => {
        setNotifCount((prev) => prev + 1);
        playNotificationSound(); // استخدم صوت الإشعار وليس الرسالة
      });

      // استمع لإشعارات المستخدم العادي
      if (!user.is_admin) {
        const userNotifChannel = echo.private('user.notifications.' + user.id);
        userNotifChannel.listen('NewUserNotification', (data: any) => {
          
          // إضافة الإشعار الجديد للقائمة مع تجنب التكرار
          setUserNotifs(prev => {
            const exists = prev.some(n => n.id === data.notification.id);
            if (!exists) {
              return [data.notification, ...prev];
            }
            return prev;
          });
          
          // زيادة عداد الإشعارات غير المقروءة فوراً
          setUserNotifCount(prev => {
            const newCount = prev + 1;
            return newCount;
          });
          
          // تشغيل صوت الإشعار
          playNotificationSound();
          
          // تحديث فوري من API للتأكد من الدقة (بدون استبدال القيمة المحسنة)
          setTimeout(() => {
            import('@/components/Api/axios').then(m => m.default.get('/notifications/unread-count')).then(res => {
              const apiCount = res.data.count || 0;
              // استخدم القيمة الأكبر بين المحسنة والـ API
              setUserNotifCount(prev => {
                const finalCount = Math.max(prev, apiCount);
                return finalCount;
              });
            }).catch(() => {});
          }, 1000);
          
          // تحديث إضافي بعد ثانيتين للتأكد من ظهور العداد
          setTimeout(() => {
            setUserNotifCount(prev => {
              if (prev === 0) {
                return 1;
              }
              return prev;
            });
          }, 2000);
        });
      }
    })();
    return () => {
      if (echoInstance) {
        echoInstance.leave('chat.' + user?.id);
        echoInstance.leave('notifications');
        if (user && !user.is_admin) {
          echoInstance.leave('user.notifications.' + user.id);
        }
      }
    };
  }, [user, chatOpen, selectedUser]);

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

  // جلب الرسائل وحساب unreadCounts لكل مستخدم عند تحميل الصفحة أو كل 30 ثانية (تحسين كبير للأداء)
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
    // تحديث كل 30 ثانية بدلاً من كل ثانية (تحسين كبير للأداء)
    interval = setInterval(fetchUnreadCountsAndLastMessages, 30000);
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
      playMessageSound();
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
  }, [user]);

  // 1. أضف useRef لتتبع آخر ID إشعار تم عرضه
  const lastNotifIdRef = useRef<number | null>(null);

  const [showNotifBubble, setShowNotifBubble] = useState(false);
  const [notifBubbleText, setNotifBubbleText] = useState('');
  const notifBubbleTimeout = useRef<NodeJS.Timeout | null>(null);

  // عند استقبال إشعار جديد عبر WebSocket، أظهر الفقاعة
  useEffect(() => {
    let echoInstance: any = null;
    (async () => {
      const storedToken = localStorage.getItem('token');
      if (!user || !storedToken) return;
      const echo = createEcho(storedToken);
      if (!echo) return;
      echoInstance = echo;
      const notifChannel = echo.channel('notifications');
      notifChannel.listen('NewNotification', (data: any) => {
        const notifId = data?.notification?.id || data?.id;
        const notifTitle = data?.notification?.title_ar || data?.notification?.title_fr || data?.title || 'إشعار جديد';
        if (notifId && notifId !== lastNotifIdRef.current) {
          lastNotifIdRef.current = notifId;
          setNotifCount((prev) => prev + 1);
          setNotifBubbleText(notifTitle);
          setShowNotifBubble(true);
          if (notifBubbleTimeout.current) clearTimeout(notifBubbleTimeout.current);
          notifBubbleTimeout.current = setTimeout(() => setShowNotifBubble(false), 5000);
          playNotificationSound();
        }
      });
    })();
    return () => {
      if (echoInstance) {
        echoInstance.leave('notifications');
        if (notifBubbleTimeout.current) clearTimeout(notifBubbleTimeout.current);
      }
    };
  }, [user]);

  // شغّل صوت الإشعار فقط عند زيادة العدد
  const prevNotifCount = useRef(notifCount);
  useEffect(() => {
    if (notifCount > prevNotifCount.current) {
      playNotificationSound();
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

  const getUserNotifTitle = (notif: any, language: string) => {
    const typeMap: any = {
      workCertificate: language === 'ar' ? 'شهادة عمل' : 'Attestation de travail',
      vacationRequest: language === 'ar' ? 'طلب إجازة' : 'Demande de congé',
      missionOrder: language === 'ar' ? 'أمر مهمة' : 'Ordre de mission',
      salaryDomiciliation: language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire',
      annualIncome: language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels',
      // إضافة الأنواع القديمة (plural forms)
      work_certificates: language === 'ar' ? 'شهادة عمل' : 'Attestation de travail',
      vacation_requests: language === 'ar' ? 'طلب إجازة' : 'Demande de congé',
      mission_orders: language === 'ar' ? 'أمر مهمة' : 'Ordre de mission',
      salary_domiciliations: language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire',
      annual_incomes: language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels',
    };
    // استخدم notif.type مباشرة
    if (notif.type && typeMap[notif.type]) return typeMap[notif.type];

    // ابحث عن الكلمات المفتاحية في العنوان أو body
    const text = ((language === 'ar' ? notif.title_ar : notif.title_fr) || '') +
                 ' ' +
                 ((language === 'ar' ? notif.body_ar : notif.body_fr) || '');

    for (const key in typeMap) {
      if (text.includes(typeMap[key])) return typeMap[key];
    }

    // ابحث عن كلمات مفتاحية شائعة
    if (/عمل|travail/i.test(text)) return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
    if (/إجازة|congé/i.test(text)) return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
    if (/مهمة|mission/i.test(text)) return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
    if (/توطين|salaire/i.test(text)) return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
    if (/دخل|revenu/i.test(text)) return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';

    // إذا لم تجد أي نوع، استخدم نوع الطلب من البيانات
    if (notif.data) {
      try {
        const data = JSON.parse(notif.data);
        if (data.work_certificate_id) return language === 'ar' ? 'شهادة عمل' : 'Attestation de travail';
        if (data.vacation_request_id) return language === 'ar' ? 'طلب إجازة' : 'Demande de congé';
        if (data.mission_order_id) return language === 'ar' ? 'أمر مهمة' : 'Ordre de mission';
        if (data.salary_domiciliation_id) return language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire';
        if (data.annual_income_id) return language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels';
      } catch (e) {
        // تجاهل أخطاء JSON
      }
    }

    // إذا لم تجد أي نوع، استخدم نوع الطلب من البيانات
    if (notif.data) {
      try {
        const data = JSON.parse(notif.data);
        if (data.request_type) {
          const requestTypeMap: any = {
            workCertificate: language === 'ar' ? 'شهادة عمل' : 'Attestation de travail',
            vacationRequest: language === 'ar' ? 'طلب إجازة' : 'Demande de congé',
            missionOrder: language === 'ar' ? 'أمر مهمة' : 'Ordre de mission',
            salaryDomiciliation: language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire',
            annualIncome: language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels',
            // إضافة الأنواع القديمة
            work_certificates: language === 'ar' ? 'شهادة عمل' : 'Attestation de travail',
            vacation_requests: language === 'ar' ? 'طلب إجازة' : 'Demande de congé',
            mission_orders: language === 'ar' ? 'أمر مهمة' : 'Ordre de mission',
            salary_domiciliations: language === 'ar' ? 'توطين الراتب' : 'Domiciliation de salaire',
            annual_incomes: language === 'ar' ? 'شهادة دخل سنوي' : 'Attestation de revenus annuels',
          };
          return requestTypeMap[data.request_type] || (language === 'ar' ? 'طلب جديد' : 'Nouvelle demande');
        }
      } catch (e) {
        // تجاهل أخطاء JSON
      }
    }

    // إذا لم تجد أي نوع، استخدم نص افتراضي محسن
    return language === 'ar' ? 'طلب جديد' : 'Nouvelle demande';
  };

  const getNotifTitleColorUser = (notif: any) => {
    const status = notif.status || notif.request_status || '';
    const title = (notif.title_ar || notif.title_fr || '').toLowerCase();
    if (/تم تجهيز ملفك من الإدارة|votre fichier est prêt/i.test(title)) return 'text-green-700';
    if (/تم قبول طلبك، بانتظار رفع ملف الإدارة|acceptée, en attente du fichier/i.test(title)) return 'text-orange-600';
    if (/تم رفض طلبك|refusée/i.test(title)) return 'text-red-700';
    if (/تم حفظ شهادة العمل بنجاح|sauvegardée avec succès/i.test(title)) return 'text-blue-700';
    if (status === 'approved' || /acceptée|succès|تم قبول|تمت الموافقة/.test(title)) return 'text-green-700';
    if (status === 'rejected' || /رفض|refusée/.test(title)) return 'text-red-700';
    if (status === 'waiting_admin_file' || /انتظار ملف الإدارة|en attente du fichier/.test(title)) return 'text-orange-600';
    if (status === 'pending' || status === '' || /قيد المراجعة|envoyée|sauvegardée/.test(title)) return 'text-blue-700';
    return 'text-blue-700';
  };

  const getUserNotificationText = (notif: any, language: string) => {
    const title = (language === 'ar' ? notif.title_ar : notif.title_fr) || '';
    if (/تم تجهيز ملفك من الإدارة|votre fichier est prêt/i.test(title)) return language === 'ar' ? 'تم قبول ملفك ويمكنك تحميله من صفحة جميع الطلبات.' : 'Votre fichier a été accepté. Vous pouvez le télécharger depuis la page de toutes les demandes.';
    if (/تم قبول طلبك، بانتظار رفع ملف الإدارة|acceptée, en attente du fichier/i.test(title)) return language === 'ar' ? 'تمت الموافقة، انتظر ملف الإدارة.' : "En attente du fichier de l'admin.";
    if (/تم رفض طلبك|refusée/i.test(title)) return language === 'ar' ? 'تم الرفض بسبب نقص أو خطأ في الملف. يمكنك إعادة الطلب.' : 'Refusé pour dossier incomplet ou erreur. Vous pouvez refaire la demande.';
    if (/تم حفظ شهادة العمل بنجاح|sauvegardée avec succès/i.test(title)) return language === 'ar' ? 'تم إرسال الطلب وهو قيد المراجعة من الإدارة.' : 'Votre demande a été envoyée et est en cours de révision par l’administration.';
    // fallback القديم
    const status = notif.status || notif.request_status || '';
    if (status === 'waiting_admin_file') {
      return language === 'ar' ? 'تمت الموافقة، انتظر ملف الإدارة.' : "En attente du fichier de l'admin.";
    }
    if (status === 'approved') {
      return language === 'ar' ? 'تم قبول ملفك ويمكنك تحميله من صفحة جميع الطلبات.' : 'Votre fichier a été accepté. Vous pouvez le télécharger depuis la page de toutes les demandes.';
    }
    if (status === 'rejected') {
      return language === 'ar' ? 'تم الرفض بسبب نقص أو خطأ في الملف. يمكنك إعادة الطلب.' : 'Refusé pour dossier incomplet ou erreur. Vous pouvez refaire la demande.';
    }
    if (status === 'pending' || status === '') {
      return language === 'ar' ? 'تم إرسال الطلب وهو قيد المراجعة من الإدارة.' : 'Votre demande a été envoyée et est en cours de révision par l’administration.';
    }
    return language === 'ar' ? notif.body_ar : notif.body_fr;
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
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gradient-to-r from-cmc-blue to-cmc-green text-xs">
                    {userNotifCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 md:w-80 cmc-card p-0">
              <div style={{height: 300, minWidth: 320}} className="flex flex-col">
                <h4 className="font-semibold text-slate-800 mb-2 px-4 pt-3">{t('notifications')}</h4>
                {userNotifs.length === 0 && <div className="text-gray-500 px-4">لا توجد إشعارات جديدة.</div>}
                <div className="flex-1 overflow-y-auto px-2">
                  {userNotifs.slice(0, visibleUserNotifCount).map((notif, idx) => {
                    return (
                      <div key={notif.id || idx} className={`rounded p-2 mb-1 ${notif.is_read ? '' : 'bg-cmc-blue-light/20'}`}>
                        {/* عنوان الإشعار بلون الحالة أو نوع الطلب */}
                        <div className={`font-bold text-sm ${getNotifTitleColorUser(notif)}`}>{getUserNotifTitle(notif, language)}</div>
                        {/* نص الإشعار المحسن حسب الحالة */}
                        <div className="text-xs text-gray-700 mt-1">{getUserNotificationText(notif, language)}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'fr-FR')}</div>
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
                                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.image_path}`}
                                      alt="chat-img"
                                      className="max-w-[120px] max-h-[120px] mb-1 rounded shadow cursor-pointer border border-gray-300"
                                      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                                      onClick={() => setModalImage(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.image_path}`)}

                                      
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
                                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.file_path}`}
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
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cmc-blue to-cmc-green text-white rounded-full text-xs px-1.5 py-0.5 min-w-[20px] text-center">
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