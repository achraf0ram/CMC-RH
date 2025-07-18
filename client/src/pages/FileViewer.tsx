import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FileViewer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  // نحصل على مسار الملف من كود الاستعلام
  const params = new URLSearchParams(location.search);
  const file = params.get('file');
  const fullName = params.get('full_name');
  const highlightId = params.get('highlight');

  let cleanFile = file;
  if (file) {
    // إذا كان المسار فيه مجلد فرعي مثل requests/workcert/workcert_34.pdf
    const match = file.match(/requests\/(workcert|vacation|mission)\/(workcert|vacation|mission)_(\d+)\.pdf$/);
    if (match) {
      cleanFile = `requests/${match[2]}_${match[3]}.pdf`;
    }
  }

  if (!file) {
    return <div className="p-8 text-center text-red-600">{t('noFileToShow') || 'لا يوجد ملف للعرض'}</div>;
  }

  // تحديد نوع الملف (صورة أو PDF)
  const isImage = cleanFile ? /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(cleanFile) : false;
  const isPDF = cleanFile ? /\.pdf$/i.test(cleanFile) : false;

  // دالة الطباعة
  const handlePrint = () => {
    if (isImage) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<img src='${file}' style='max-width:100%;' onload='window.print();window.close();' />`);
        printWindow.document.close();
      }
    } else if (isPDF) {
      const printWindow = window.open(file, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-0 relative">
      {/* شريط علوي ثابت للأزرار */}
      <div className="sticky top-0 left-0 w-full flex justify-between items-center gap-4 bg-white/90 backdrop-blur z-50 p-4 shadow-md border-b">
        {/* يسار: اسم المستخدم إذا وجد */}
        {fullName && (
          <div className="font-bold text-blue-700 text-lg truncate max-w-xs" style={{direction: 'ltr'}}>
            {fullName}
          </div>
        )}
        <div className="flex gap-4 items-center ml-auto">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4 py-2 shadow font-semibold">
            <Printer className="w-5 h-5" />
            {t('print') || 'طباعة'}
          </button>
          <a href={cleanFile} download className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 shadow font-semibold" title={t('download') || 'تحميل الملف'}>
            <Download className="w-5 h-5" />
            {t('download') || 'تحميل'}
          </a>
          <button onClick={() => {
            if (highlightId) {
              // أعد المستخدم إلى الجدول مع إبراز الصف وفتح تبويب الطلبات
              window.location.href = `/admin/dashboard?tab=requests&highlight=${highlightId}`;
            } else {
              navigate(-1);
            }
          }} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full px-4 py-2 shadow font-semibold ml-2">
            {t('back') || 'رجوع'}
          </button>
        </div>
      </div>
      <div className="flex-1 w-full flex justify-center items-center p-4">
        <div className="bg-white p-4 rounded shadow max-w-full">
          {isImage && <img src={cleanFile} alt={t('filePreview') || 'عرض الملف'} className="max-w-full max-h-[70vh]" />}
          {isPDF && <iframe src={cleanFile} title="PDF Viewer" className="w-[80vw] h-[70vh]" />}
          {!isImage && !isPDF && <div>{t('cannotShowFileType') || 'لا يمكن عرض هذا النوع من الملفات مباشرة.'}</div>}
        </div>
      </div>
    </div>
  );
};

export default FileViewer; 