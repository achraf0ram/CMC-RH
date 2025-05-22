
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
export const Dashboard = () => {
  const { t } = useLanguage();

  const stats = [
    {
      title: t('pendingRequests'),
      value: '5',
      description: t('awaitingApproval')
    },
    {
      title: t('approvedRequests'),
      value: '12',
      description: t('thisMonth')
    },
    {
      title: t('vacationDays'),
      value: '15',
      description: t('remaining')
    },
  ];
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>{t("dashboard")}</h1>
      <div>
        {user ? (
          <div>مرحباً {user.name}</div>
        ) : (
          <div className='text-gray-500 text-sm'>
            جارٍ تحميل بيانات المستخدم...
          </div>
        )}
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <p className='text-xs text-muted-foreground'>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

