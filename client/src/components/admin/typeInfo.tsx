import { Calendar, FileText, ClipboardCheck, CreditCard, DollarSign } from 'lucide-react';
import React from 'react';

export const getTypeInfo = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'vacationRequest':
      return { label: t('vacationRequest'), color: 'bg-blue-100 text-blue-700', icon: <Calendar className="w-4 h-4 mr-1 inline" /> };
    case 'workCertificate':
      return { label: t('workCertificate'), color: 'bg-green-100 text-green-700', icon: <FileText className="w-4 h-4 mr-1 inline" /> };
    case 'missionOrder':
      return { label: t('missionOrder'), color: 'bg-purple-100 text-purple-700', icon: <ClipboardCheck className="w-4 h-4 mr-1 inline" /> };
    case 'salaryDomiciliation':
      return { label: t('salaryDomiciliation'), color: 'bg-cyan-100 text-cyan-700', icon: <CreditCard className="w-4 h-4 mr-1 inline" /> };
    case 'annualIncome':
      return { label: t('annualIncome'), color: 'bg-orange-100 text-orange-700', icon: <DollarSign className="w-4 h-4 mr-1 inline" /> };
    default:
      return { label: t('notSpecified') || type, color: 'bg-gray-100 text-gray-800', icon: null };
  }
}; 