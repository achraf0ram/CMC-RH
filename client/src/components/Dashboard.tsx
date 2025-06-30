import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Calendar, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

export const Dashboard = () => {
  const { t } = useLanguage();
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [vacationDays, setVacationDays] = useState(0);
  const [vacationCount, setVacationCount] = useState(0);
  const [missionCount, setMissionCount] = useState(0);
  const [certificateCount, setCertificateCount] = useState(0);
  const [vacationRequests, setVacationRequests] = useState([]);
  const [missionOrders, setMissionOrders] = useState([]);
  const [workCertificates, setWorkCertificates] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/api/vacation-requests/pending/count")
      .then(res => setPendingCount(res.data.count))
      .catch(() => setPendingCount(0));
    axios.get("http://localhost:8000/api/vacation-requests/approved/count")
      .then(res => setApprovedCount(res.data.count))
      .catch(() => setApprovedCount(0));
    axios.get("http://localhost:8000/api/vacation-requests/vacation-days/sum")
      .then(res => setVacationDays(res.data.days))
      .catch(() => setVacationDays(0));
    axios.get('http://localhost:8000/api/vacation-requests/count')
      .then(res => setVacationCount(res.data.count));
    axios.get('http://localhost:8000/api/mission-orders/count')
      .then(res => setMissionCount(res.data.count));
    axios.get('http://localhost:8000/api/work-certificates/count')
      .then(res => setCertificateCount(res.data.count));
    axios.get('/api/vacation-requests/user', { withCredentials: true })
      .then(res => setVacationRequests(res.data));
    axios.get('/api/mission-orders/user', { withCredentials: true })
      .then(res => setMissionOrders(res.data));
    axios.get('/api/work-certificates/user', { withCredentials: true })
      .then(res => setWorkCertificates(res.data));
  }, []);

  const stats = [   
    {
      title: "كل طلبات الإجازة",
      value: vacationCount,
      description: t('awaitingApproval'),
      icon: Calendar,
      color: 'from-cmc-blue to-cmc-blue-dark'
    },
    {
      title: "كل أوامر المهمة",
      value: missionCount,
      description: t('thisMonth'),
      icon: CheckCircle,
      color: 'from-cmc-green to-emerald-600'
    },
    {
      title: "كل شهادات العمل",
      value: certificateCount,
      description: t('remaining'),
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
          <p className="text-slate-600 text-sm md:text-base">لوحة التحكم الرئيسية</p>
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
              الإجراءات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-cmc-blue-light/50 to-cmc-blue-light/30 rounded-lg border border-cmc-blue/20 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-cmc-blue mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">طلب إجازة جديد</h3>
                <p className="text-xs md:text-sm text-slate-600">تقديم طلب إجازة سنوية أو مرضية</p>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-cmc-green-light/50 to-cmc-green-light/30 rounded-lg border border-cmc-green/20 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-cmc-green mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">شهادة عمل</h3>
                <p className="text-xs md:text-sm text-slate-600">طلب شهادة عمل أو راتب</p>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-emerald-100/50 to-emerald-50/30 rounded-lg border border-emerald-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-emerald-600 mx-auto mb-3 md:mb-4" />
                <h3 className="font-semibold text-slate-800 mb-2 text-sm md:text-base">أمر مهمة</h3>
                <p className="text-xs md:text-sm text-slate-600">تقديم طلب أمر مهمة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
