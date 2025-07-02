import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import axiosInstance from '@/components/Api/axios';

interface UrgentChatButtonProps {
  hide?: boolean;
}

const UrgentChatButton: React.FC<UrgentChatButtonProps> = ({ hide }) => {
  if (hide) return null;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState('fast');
  const { t, language } = useLanguage();

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/urgent-messages', {
        message: `[${t('urgentMessageOption' + capitalize(selectedOption))}] ${message}`,
      });
      setSuccess(true);
      setMessage('');
    } catch (err: any) {
      // عرض رسالة الخطأ الحقيقية إذا وجدت
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(t('urgentMessageError') || 'حدث خطأ أثناء الإرسال');
      }
    } finally {
      setLoading(false);
    }
  };

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <>
      {/* زر عائم */}
      <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-[9999]`}>
        <div className="group relative">
          <button
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-colors duration-200"
            onClick={() => setOpen(true)}
            title={t('urgentChat') || (language === 'ar' ? 'رسالة عاجلة' : 'Message urgente')}
            type="button"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          {/* Tooltip عند تمرير الفأرة */}
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            {t('urgentChat') || (language === 'ar' ? 'رسالة عاجلة' : 'Message urgente')}
          </span>
        </div>
      </div>
      {/* نافذة الشات */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => { setOpen(false); setSuccess(false); setError(''); }}>&times;</button>
            <h2 className="text-lg font-bold mb-2 text-red-700">{t('urgentMessageTitle') || 'رسالة عاجلة للإدارة'}</h2>
            {success ? (
              <div className="text-green-600 font-semibold py-8 text-center">{t('urgentMessageSent') || 'تم إرسال رسالتك بنجاح! سيتم التواصل معك قريبًا.'}</div>
            ) : (
              <>
                <textarea
                  className="w-full border rounded p-2 mb-3 min-h-[80px]"
                  placeholder={t('urgentMessagePlaceholder') || 'اكتب رسالتك العاجلة هنا...'}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  disabled={loading}
                />
                <select
                  className="w-full border rounded p-2 mb-3"
                  value={selectedOption}
                  onChange={e => setSelectedOption(e.target.value)}
                  disabled={loading}
                >
                  <option value="fast">{t('urgentMessageOptionFast')}</option>
                  <option value="tech">{t('urgentMessageOptionTech')}</option>
                  <option value="question">{t('urgentMessageOptionQuestion')}</option>
                  <option value="other">{t('urgentMessageOptionOther')}</option>
                </select>
                {error && <div className="text-red-600 mb-2">{error}</div>}
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold w-full"
                  onClick={handleSend}
                  disabled={loading || !message.trim()}
                >
                  {loading ? t('urgentMessageSending') || 'جاري الإرسال...' : t('urgentMessageSend') || 'إرسال الرسالة العاجلة'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UrgentChatButton; 