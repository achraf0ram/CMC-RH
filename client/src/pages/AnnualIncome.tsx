import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AnnualIncome: React.FC = () => {
  const { language, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0] || null;
    setFile(uploadedFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    setTimeout(() => {
      alert(t('requestSubmitted'));
      setIsSubmitting(false);
      setFile(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            {t('annualIncome')}
          </h1>
          <p className="text-gray-600 text-sm md:text-base">{language === 'ar' ? 'يرجى رفع صورة أو ملف PDF مكتوب لهذا الطلب.' : 'Veuillez télécharger une image ou un fichier PDF pour cette demande.'}</p>
        </div>
        {/* Card */}
        <div className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg py-4 px-6">
            <h2 className="text-lg font-semibold text-center">{language === 'ar' ? 'تحميل المستند' : 'Téléchargement du document'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-6 md:p-8">
            <div className="flex flex-col items-center gap-4">
              <label className="block mb-1 font-medium text-slate-700">{language === 'ar' ? 'رفع صورة أو ملف PDF' : 'Télécharger une image ou un PDF'}</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="w-full max-w-xs border border-blue-300 focus:border-blue-500 focus:ring-blue-200 rounded px-3 py-2"
                required
              />
              {file && (
                <span className="text-green-600 text-sm mt-2">{file.name}</span>
              )}
            </div>
            <div className="flex justify-center pt-4 md:pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnnualIncome;
