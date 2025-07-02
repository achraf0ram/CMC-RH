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

  if (!file) {
    return <div className="p-8 text-center text-red-600">{t('noFileToShow') || 'لا يوجد ملف للعرض'}</div>;
  }

  // تحديد نوع الملف (صورة أو PDF)
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file);
  const isPDF = /\.pdf$/i.test(file);

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
      <div className="sticky top-0 left-0 w-full flex justify-end items-center gap-4 bg-white/90 backdrop-blur z-50 p-4 shadow-md border-b">
        <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4 py-2 shadow font-semibold">
          <Printer className="w-5 h-5" />
          {t('print') || 'طباعة'}
        </button>
        <a href={file} download className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 shadow font-semibold" title={t('download') || 'تحميل الملف'}>
          <Download className="w-5 h-5" />
          {t('download') || 'تحميل'}
        </a>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full px-4 py-2 shadow font-semibold ml-2">
          {t('back') || 'رجوع'}
        </button>
      </div>
      <div className="flex-1 w-full flex justify-center items-center p-4">
        <div className="bg-white p-4 rounded shadow max-w-full">
          {isImage && <img src={file} alt={t('filePreview') || 'عرض الملف'} className="max-w-full max-h-[70vh]" />}
          {isPDF && <iframe src={file} title="PDF Viewer" className="w-[80vw] h-[70vh]" />}
          {!isImage && !isPDF && <div>{t('cannotShowFileType') || 'لا يمكن عرض هذا النوع من الملفات مباشرة.'}</div>}
        </div>
      </div>
    </div>
  );
};

export default FileViewer; 