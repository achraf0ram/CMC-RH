import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AdminRequestsTable } from '@/components/admin/AdminRequestsTable';
import { UsersTable } from '@/components/admin/UsersTable';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { MetricsCard } from '@/components/admin/MetricsCard';
import { useAdminData, Stats } from '@/hooks/useAdminData';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminUrgentMessages from '@/components/admin/AdminUrgentMessages';
import axiosInstance from '@/components/Api/axios';

const AdminDashboard: React.FC = () => {
  const { requests, users, stats, isLoading, error, refreshData, setRequests } = useAdminData();
  const [activeTab, setActiveTab] = useState('overview');
  const { t, language } = useLanguage();
  const [urgentCount, setUrgentCount] = useState<number>(0);
  const [highlightedRequestId, setHighlightedRequestId] = useState<string|null>(null);
  const requestsListRef = useRef<HTMLDivElement>(null);

  // جلب عدد الرسائل العاجلة
  const fetchUrgentCount = async () => {
    try {
      const res = await axiosInstance.get('/admin/urgent-messages');
      setUrgentCount(res.data.length);
    } catch {}
  };

  useEffect(() => {
    fetchUrgentCount();
  }, []);

  // عند تحديث البيانات
  const handleRefreshData = async () => {
    await refreshData();
    fetchUrgentCount();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Plateforme de Gestion RH - CMC..</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">خطأ في تحميل البيانات</h2>
            <p className="text-gray-500 text-center mb-4">{error}</p>
            <Button onClick={handleRefreshData} className="bg-blue-600 hover:bg-blue-700">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the imported Stats type for the fallback object
  const safeStats: Stats = stats || { totalUsers: 0, totalRequests: 0, pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0 };

  // --- Real-time Metrics Calculation ---

  // 1. Response Rate (processed within 24h)
  const processedRequests = requests.filter(r => r.status !== 'pending' && r.updated_at);
  const processedWithin24h = processedRequests.filter(r => {
    const createdAt = new Date(r.created_at).getTime();
    const updatedAt = new Date(r.updated_at).getTime();
    return (updatedAt - createdAt) <= 24 * 60 * 60 * 1000;
  });
  const responseRate = processedRequests.length > 0
    ? Math.round((processedWithin24h.length / processedRequests.length) * 100)
    : 0;

  // 2. Average Processing Time
  const totalProcessingTime = processedRequests.reduce((acc, r) => {
    const createdAt = new Date(r.created_at).getTime();
    const updatedAt = new Date(r.updated_at).getTime();
    return acc + (updatedAt - createdAt);
  }, 0);
  const avgProcessingTimeMs = processedRequests.length > 0
    ? totalProcessingTime / processedRequests.length
    : 0;
  const avgProcessingTimeDays = (avgProcessingTimeMs / (1000 * 60 * 60 * 24)).toFixed(1);

  // 3. Rejection Rate
  const totalProcessedCount = safeStats.approvedRequests + safeStats.rejectedRequests;
  const rejectionRate = totalProcessedCount > 0
    ? Math.round((safeStats.rejectedRequests / totalProcessedCount) * 100)
    : 0;

  // 4. Monthly Requests
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthRequestsCount = requests.filter(r => new Date(r.created_at) >= startOfMonth).length;
  const lastMonthRequestsCount = requests.filter(r => {
      const requestDate = new Date(r.created_at);
      return requestDate >= startOfLastMonth && requestDate <= endOfLastMonth;
  }).length;
  
  const metricsData = [
    {
      title: t('responseRate24h'),
      value: `${responseRate}%`,
      description: t('responseRate24hDesc'),
      icon: TrendingUp,
      trend: undefined,
      previousValue: undefined
    },
    {
      title: t('avgProcessingTime'),
      value: `${avgProcessingTimeDays} ${t('days')}`,
      description: t('avgProcessingTimeDesc'),
      icon: Clock,
      trend: undefined,
      previousValue: undefined
    },
    {
      title: t('rejectionRate'),
      value: `${rejectionRate}%`,
      description: t('rejectionRateDesc'),
      icon: AlertTriangle,
      trend: undefined,
      previousValue: undefined
    },
    {
      title: t('monthlyRequests'),
      value: thisMonthRequestsCount.toString(),
      previousValue: lastMonthRequestsCount,
      trend: thisMonthRequestsCount > lastMonthRequestsCount ? 'up' as const : thisMonthRequestsCount < lastMonthRequestsCount ? 'down' as const : undefined,
      description: t('monthlyRequestsDesc'),
      icon: BarChart3
    }
  ];

  const quickStats = {
    pendingToday: requests.filter(r => {
      const today = new Date().toDateString();
      return r.status === 'pending' && new Date(r.created_at).toDateString() === today;
    }).length,
    newUsersThisWeek: users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.created_at) > weekAgo;
    }).length,
    urgentRequests: 0, // Placeholder
  };

  const getRequestTypeName = (type: string) => {
    switch(type) {
      case 'Work Certificate': return t('workCertificate_t');
      case 'Vacation Request': return t('vacationRequest_t');
      case 'Mission Order': return t('missionOrder_t');
      case 'Salary Domiciliation': return t('salaryDomiciliation_t');
      case 'Annual Income': return t('annualIncome_t');
      default: return type;
    }
  }

  const getStatusName = (status: string) => {
    switch(status) {
      case 'pending': return t('pending');
      case 'approved': return t('approved');
      case 'rejected': return t('rejected');
      default: return status;
    }
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 lg:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen max-w-7xl">
      {/* Header */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 ${language === 'ar' ? 'text-center md:text-right' : 'text-center md:text-left'}`}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('adminDashboardTitle')}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {t('adminDashboardDesc')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleRefreshData} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              <span>{t('refreshData')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t('pendingToday')}</p>
                <p className="text-3xl font-bold">{quickStats.pendingToday}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t('newUsersThisWeek')}</p>
                <p className="text-3xl font-bold">{quickStats.newUsersThisWeek}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">{t('urgentRequests')}</p>
                <p className="text-3xl font-bold">{urgentCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Card className="shadow-sm">
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
          setHighlightedRequestId(null);
        }}>
          <div className="border-b">
            <TabsList className="w-full h-auto md:h-12 bg-gray-50 p-1">
              <TabsTrigger 
                value="overview" 
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white"
              >
                <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('overview')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white"
              >
                <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="truncate">
                  <span className="hidden sm:inline">
                    {language === 'fr'
                      ? `${t('requestsManagement')} (${safeStats.totalRequests})`
                      : `${t('requestsManagement')} (${safeStats.totalRequests})`}
                  </span>
                  <span className="sm:hidden">
                    {language === 'fr'
                      ? `${t('requests')} (${safeStats.totalRequests})`
                      : `${t('requests')} (${safeStats.totalRequests})`}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="employees" 
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white"
              >
                <Users className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="truncate">
                  <span className="hidden sm:inline">
                    {language === 'fr'
                      ? `${t('employeesManagement')} (${safeStats.totalUsers})`
                      : `${t('employeesManagement')} (${safeStats.totalUsers})`}
                  </span>
                  <span className="sm:hidden">
                    {language === 'fr'
                      ? `${t('employees')} (${safeStats.totalUsers})`
                      : `${t('employees')} (${safeStats.totalUsers})`}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="urgent" 
                className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-white"
              >
                <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 text-red-600" />
                <span className="hidden sm:inline">{t('urgentRequests')}</span>
                <span className="sm:hidden">Urgent</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* أحدث الطلبات */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {t('latestRequests')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-72 overflow-y-auto" ref={requestsListRef}>
                    {requests.length > 0 ? requests.slice(0, 20).map((request) => {
                      const typeInfo = (() => {
                        switch(request.type) {
                          case 'workCertificate': return { label: t('workCertificate'), color: 'bg-green-100 text-green-700' };
                          case 'vacationRequest': return { label: t('vacationRequest'), color: 'bg-blue-100 text-blue-700' };
                          case 'missionOrder': return { label: t('missionOrder'), color: 'bg-purple-100 text-purple-700' };
                          case 'salaryDomiciliation': return { label: t('salaryDomiciliation'), color: 'bg-cyan-100 text-cyan-700' };
                          case 'annualIncome': return { label: t('annualIncome'), color: 'bg-orange-100 text-orange-700' };
                          default: return { label: t('notSpecified'), color: 'bg-gray-100 text-gray-800' };
                        }
                      })();
                      const uniqueKey = `${request.id}-${request.type}`;
                      return (
                        <div
                          key={uniqueKey}
                          className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all cursor-pointer border-2 ${highlightedRequestId === uniqueKey ? 'border-blue-500 shadow-md' : 'border-transparent'}`}
                          onClick={() => {
                            setActiveTab('requests');
                            setHighlightedRequestId(uniqueKey);
                            setTimeout(() => {
                              if (requestsListRef.current) {
                                requestsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 200);
                          }}
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              {request.full_name || t('notSpecified')}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {getStatusName(request.status)}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-center text-gray-500 py-8">{t('noRequests')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* أحدث الموظفين */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    {t('latestUsers')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.length > 0 ? users.slice(0, 6).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">
                            {user.name || 'مستخدم غير معروف'}
                          </p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )) : (
                      <p className="text-center text-gray-500 py-8">{t('noUsers')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* بطاقات المقاييس المتقدمة */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('performanceMetrics')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricsData.map((metric, index) => (
                  <MetricsCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    previousValue={metric.previousValue}
                    trend={metric.trend}
                    description={metric.description}
                    icon={metric.icon}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="p-4 sm:p-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('allRequestsManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <AdminRequestsTable 
                    requests={requests}
                    onRequestUpdate={handleRefreshData}
                    setRequests={setRequests}
                    highlightedRequestId={highlightedRequestId}
                    clearHighlight={() => setHighlightedRequestId(null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="p-0 sm:p-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('allEmployeesManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <UsersTable users={users} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urgent" className="p-4 sm:p-6">
            <AdminUrgentMessages />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
export default AdminDashboard;
