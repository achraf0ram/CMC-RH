import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { axiosInstance as api } from '@/components/Api/axios';
import { useToast } from '@/hooks/use-toast';
import { RequestDetailsDialog } from './RequestDetailsDialog';
import { FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Calendar, ClipboardCheck, CreditCard, DollarSign } from 'lucide-react';
import { fr } from 'date-fns/locale';

// This declaration tells TypeScript that the jsPDF object and its autoTable method will exist on the window object.
declare global {
  interface Window {
    jspdf: any;
    XLSX: any;
  }
}

interface Request {
  id: number;
  full_name: string;
  matricule: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  file_path: string | null;
  scrollToAttachment?: boolean;
  leave_type?: string;
}

interface AdminRequestsTableProps {
  requests: Request[];
  onRequestUpdate: () => void;
}

export const AdminRequestsTable: React.FC<AdminRequestsTableProps> = ({ requests, onRequestUpdate }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const requestTypes = useMemo(() => {
    const types = Array.from(new Set(requests.map(r => r.type)));
    return types;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => {
        if (typeFilter === 'all') return true;
        return req.type === typeFilter;
      })
      .filter(req => {
        return req.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [requests, searchTerm, typeFilter]);

  const handleUpdateStatus = async (type: string, id: number, status: 'approved' | 'rejected') => {
    const typeSlug = type.toLowerCase().replace(/\s+/g, '_') + 's';
    try {
      await api.post(`/admin/requests/${typeSlug}/${id}/status`, { status });
      toast({
        title: 'Status Updated',
        description: `Request status has been updated to ${status}.`,
      });
      onRequestUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request status.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    (doc as any).autoTable({
      head: [['Employee', 'Matricule', 'Request Type', 'Date', 'Status']],
      body: filteredRequests.map(req => [
        req.full_name,
        req.matricule,
        req.type,
        format(new Date(req.created_at), 'PPP'),
        req.status
      ]),
    });
    doc.save('requests.pdf');
  };

  const handleExportExcel = () => {
    const worksheet = window.XLSX.utils.json_to_sheet(filteredRequests.map(req => ({
      Employee: req.full_name,
      Matricule: req.matricule,
      'Request Type': req.type,
      Date: format(new Date(req.created_at), 'PPP'),
      Status: req.status,
    })));
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
    window.XLSX.writeFile(workbook, 'requests.xlsx');
  };

  const getTypeInfo = (type: string, leaveType?: string) => {
    if (!type || type === 'Non spécifié' || type === 'غير محدد') {
      // If leaveType is available, use it for vacation requests
      if (leaveType) {
        return { label: leaveType, color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-4 h-4 mr-1 inline" /> };
      }
      return { label: t('notSpecified') || 'غير محدد', color: 'bg-gray-100 text-gray-800', icon: null };
    }
    switch (type) {
      case 'vacationRequest':
        return { label: t('vacationRequest'), color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-4 h-4 mr-1 inline" /> };
      case 'workCertificate':
        return { label: t('workCertificate'), color: 'bg-green-100 text-green-800', icon: <FileText className="w-4 h-4 mr-1 inline" /> };
      case 'missionOrder':
        return { label: t('missionOrder'), color: 'bg-yellow-100 text-yellow-800', icon: <ClipboardCheck className="w-4 h-4 mr-1 inline" /> };
      case 'salaryDomiciliation':
        return { label: t('salaryDomiciliation'), color: 'bg-indigo-100 text-indigo-800', icon: <CreditCard className="w-4 h-4 mr-1 inline" /> };
      case 'annualIncome':
        return { label: t('annualIncome'), color: 'bg-rose-100 text-rose-800', icon: <DollarSign className="w-4 h-4 mr-1 inline" /> };
      default:
        return { label: t('notSpecified') || type, color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="min-w-[220px] max-w-xs">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="inline-flex items-center gap-1 w-full truncate">
                  <span className="truncate">{`${t('allRequests') || 'كل الطلبات'} (${t('requestType') || 'جميع الأنواع'})`}</span>
                </span>
              </SelectItem>
              {requestTypes.map(type => {
                const info = getTypeInfo(type);
                return (
                  <SelectItem key={type} value={type}>
                    <span className="inline-flex items-center gap-1 w-full truncate">
                      {info.icon}
                      <span className="truncate">{info.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="ml-2">
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>
      <Table className="border rounded-lg bg-white">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-bold text-gray-700">{t('name') || 'Employee'}</TableHead>
            <TableHead className="font-bold text-gray-700">Matricule</TableHead>
            <TableHead className="font-bold text-gray-700">{t('requestType') || 'Request Type'}</TableHead>
            <TableHead className="font-bold text-gray-700">{t('startDate') || 'Date'}</TableHead>
            <TableHead className="font-bold text-gray-700">{t('file') || 'File'}</TableHead>
            <TableHead className="font-bold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map(req => (
            <TableRow
              key={`${req.type}-${req.id}`}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedRequest(req)}
            >
              <TableCell className="py-2 px-3 text-sm">{req.full_name}</TableCell>
              <TableCell className="py-2 px-3 text-sm">{req.matricule}</TableCell>
              <TableCell className="py-2 px-3 text-sm">
                {(() => {
                  const info = getTypeInfo(req.type, req.leave_type);
                  return (
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${info.color}`}>
                      {info.icon}
                      {info.label}
                    </span>
                  );
                })()}
              </TableCell>
              <TableCell className="py-2 px-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-base">
                    {format(new Date(req.created_at), 'HH:mm', { locale: fr })}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {format(new Date(req.created_at), 'd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-2 px-3 text-sm">
                {req.file_path ? (
                  <Button size="sm" variant="secondary" asChild>
                    <Link to={`/file-viewer?file=${encodeURIComponent(`http://localhost:8000/storage/${req.file_path}`)}`}>
                      FileViewer
                    </Link>
                  </Button>
                ) : (
                  <span className="text-gray-400">No File</span>
                )}
              </TableCell>
              <TableCell className="py-2 px-3 text-sm space-x-2" onClick={e => e.stopPropagation()}>
                {req.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleUpdateStatus(req.type, req.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(req.type, req.id, 'rejected')}>Reject</Button>
                  </>
                )}
                {req.file_path && ['vacationRequest', 'missionOrder', 'workCertificate'].includes(req.type) && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/file-viewer?file=${encodeURIComponent(`http://localhost:8000/storage/${req.file_path}`)}`}>
                      View File
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <RequestDetailsDialog
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}; 