import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Calendar, CheckCircle, FileText, Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance } from './Api/axios';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from "../contexts/AuthContext";

export const Dashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [vacationDays, setVacationDays] = useState(0);
  const [vacationCount, setVacationCount] = useState(0);
  const [missionCount, setMissionCount] = useState(0);
  const [certificateCount, setCertificateCount] = useState(0);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [missionOrders, setMissionOrders] = useState([]);
  const [workCertificates, setWorkCertificates] = useState([]);
  const [shownReplies, setShownReplies] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.is_admin) {
      navigate("/admin/dashboard", { replace: true });
    }
    axiosInstance.get("/vacation-requests/pending/count")
      .then(res => setPendingCount(res.data.count))
      .catch(() => setPendingCount(0));
    axiosInstance.get("/vacation-requests/approved/count")
      .then(res => setApprovedCount(res.data.count))
      .catch(() => setApprovedCount(0));
    axiosInstance.get("/vacation-requests/vacation-days/sum")
      .then(res => setVacationDays(res.data.days))
      .catch(() => setVacationDays(0));
    axiosInstance.get("/vacation-requests/user/count", { withCredentials: true })
      .then(res => setVacationCount(res.data.count))
      .catch(() => setVacationCount(0));
    axiosInstance.get("/mission-orders/user/count", { withCredentials: true })
      .then(res => setMissionCount(res.data.count))
      .catch(() => setMissionCount(0));
    axiosInstance.get("/work-certificates/user/count", { withCredentials: true })
      .then(res => setCertificateCount(res.data.count))
      .catch(() => setCertificateCount(0));
    axiosInstance.get('/vacation-requests/user', { withCredentials: true })
      .then(res => setVacationRequests(res.data));
    axiosInstance.get('/mission-orders/user', { withCredentials: true })
      .then(res => setMissionOrders(res.data));
    axiosInstance.get('/work-certificates/user', { withCredentials: true })
      .then(res => setWorkCertificates(res.data));

    // جلب الرسائل العاجلة الخاصة بالمستخدم
    axiosInstance.get('/urgent-messages/me')
      .then(res => {
        const messages = res.data || [];
        // إظهار toast لأول رسالة بها رد من الأدمن لم تُعرض بعد
        const firstNewReply = messages.find(
          (msg: any) => msg.is_replied && msg.admin_reply && !shownReplies.includes(msg.id.toString())
        );
        if (firstNewReply) {
          toast({
            title: t('urgentMessageAdminReplyTitle') || 'رد الإدارة على رسالتك العاجلة',
            description: firstNewReply.admin_reply,
            duration: 10000,
          });
          setShownReplies(prev => [...prev, firstNewReply.id.toString()]);
        }
      });
  }, [toast, t, shownReplies, user, navigate]);

  const stats = [   
    {
      title: t('allVacationRequests'),
      value: vacationCount,
      description: t('totalRequests'),
      icon: Calendar,
      color: 'from-cmc-blue to-cmc-blue-dark'
    },
    {
      title: t('allMissionOrders'),
      value: missionCount,
      description: t('totalOrders'),
      icon: CheckCircle,
      color: 'from-cmc-green to-emerald-600'
    },
    {
      title: t('allWorkCertificates'),
      value: certificateCount,
      description: t('totalCertificates'),
      icon: BarChart3,
      color: 'from-cmc-blue to-cmc-green'
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-cmc-blue-light to-cmc-green-light rounded-full mb-4 shadow-lg">
            <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-cmc-blue" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{t('dashboard')}</h1>
          <p className="text-slate-600 text-sm md:text-base">{t('dashboardMainDesc')}</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3 mb-6 md:mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="cmc-card">
              <CardHeader className={`bg-gradient-to-r ${stat.color} text-white rounded-t-lg p-4 md:p-6`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg font-semibold">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{stat.value}</div>
                <p className="text-xs md:text-sm text-slate-600">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="cmc-card">
          <CardHeader className="cmc-gradient text-white rounded-t-lg p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl font-semibold text-center">
              {t('quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Link to="/vacation-request" className="text-center p-4 md:p-6 bg-gradient-to-br from-cmc-blue-light/50 to-cmc-blue-light/30 rounded-lg border border-cmc-blue/20 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-cmc-blue mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">{t('newVacationRequest')}</h3>
                <p className="text-xs md:text-sm text-slate-600">{t('newVacationRequestDesc')}</p>
              </Link>
              <Link to="/work-certificate" className="text-center p-4 md:p-6 bg-gradient-to-br from-cmc-green-light/50 to-cmc-green-light/30 rounded-lg border border-cmc-green/20 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-cmc-green mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">{t('workCertificateAction')}</h3>
                <p className="text-xs md:text-sm text-slate-600">{t('workCertificateActionDesc')}</p>
              </Link>
              <Link to="/mission-order" className="text-center p-4 md:p-6 bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 rounded-lg border border-emerald-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-emerald-600 mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">{t('missionOrderAction')}</h3>
                <p className="text-xs md:text-sm text-slate-600">{t('missionOrderActionDesc')}</p>
              </Link>
              <Link to="/salary-domiciliation" className="text-center p-4 md:p-6 bg-gradient-to-br from-indigo-100/50 to-indigo-50/30 rounded-lg border border-indigo-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <Banknote className="w-10 h-10 md:w-12 md:h-12 text-indigo-600 mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">{t('salaryDomiciliation')}</h3>
                <p className="text-xs md:text-sm text-slate-600">{t('salaryDomiciliationDesc')}</p>
              </Link>
              <Link to="/annual-income" className="text-center p-4 md:p-6 bg-gradient-to-br from-rose-100/50 to-rose-50/30 rounded-lg border border-rose-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <FileText className="w-10 h-10 md:w-12 md:h-12 text-rose-600 mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">{t('annualIncome')}</h3>
                <p className="text-xs md:text-sm text-slate-600">{t('annualIncomeDesc')}</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
