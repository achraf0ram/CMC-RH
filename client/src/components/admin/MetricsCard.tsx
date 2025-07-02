import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideProps, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  trend?: 'up' | 'down';
  description: string;
  icon: React.ComponentType<LucideProps>;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  previousValue,
  trend,
  description,
  icon: Icon,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className="ml-1">
              vs last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 