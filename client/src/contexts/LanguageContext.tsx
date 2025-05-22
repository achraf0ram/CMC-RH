
import { createContext, useContext, useState } from 'react';

type Language = 'ar' | 'fr';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  ar: {
    home: "الرئيسية",
    dashboard: "لوحة التحكم",
    pendingRequests: "الطلبات المعلقة",
    approvedRequests: "الطلبات الموافق عليها",
    vacationDays: "أيام الإجازة",
    awaitingApproval: "في انتظار الموافقة",
    thisMonth: "هذا الشهر",
    remaining: "متبقية",
    workCertificate: "طلب شهادة عمل",
    missionOrder: "أمر مهمة",
    vacationRequest: "طلب إجازة",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    notifications: "الإشعارات",
    logout: "تسجيل الخروج",
    search: "بحث",
    viewAll: "عرض الكل",
    name: "الاسم",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    submit: "إرسال",
    cancel: "إلغاء",
    signatureUpload: "رفع التوقيع",
    reason: "السبب",
    type: "النوع",
    description: "الوصف",
    save: "حفظ",
    requestType: "نوع الطلب",
    workCertificateTitle: "طلب شهادة عمل",
    missionOrderTitle: "طلب أمر مهمة",
    vacationRequestTitle: "طلب إجازة",
    purposeLabel: "الغرض من الطلب",
    purposePlaceholder: "على سبيل المثال: تقديم للبنك، تأشيرة سفر، إلخ",
    additionalInfo: "معلومات إضافية",
    additionalInfoPlaceholder: "أي معلومات إضافية ترغب في إضافتها للطلب",
    signatureUploadButton: "اختر ملف التوقيع",
    requestSubmitted: "تم تقديم طلبك بنجاح!",
    requestReviewMessage: "سيتم مراجعة الطلب وإصدار الشهادة في أقرب وقت",
    followUpMessage: "يمكنك متابعة حالة الطلب من الصفحة الرئيسية",
    newRequest: "طلب جديد",
    requestInfo: "معلومات الطلب",
    destination: "الوجهة",
    destinationPlaceholder: "على سبيل المثال: الداربيضاء، الرباط، خارج البلاد",
    selectDate: "اختر تاريخ",
    signature: "التوقيع",
    annualLeave: "إجازة سنوية",
    sickLeave: "إجازة مرضية",
    emergencyLeave: "إجازة اضطرارية",
    unpaidLeave: "إجازة بدون راتب",
    vacationReasonPlaceholder: "يرجى ذكر سبب الإجازة إذا كان ذلك ضرورياً",
    profileSettings: "معلومات الملف الشخصي",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    saveChanges: "حفظ التغييرات",
    notificationSettings: "إعدادات الإشعارات",
    emailNotifications: "إشعارات البريد الإلكتروني",
    emailNotificationsDesc: "استلام الإشعارات عبر البريد الإلكتروني",
    newRequests: "طلبات جديدة",
    newRequestsDesc: "إشعارات عند إنشاء طلبات جديدة",
    requestUpdates: "تحديثات الطلبات",
    requestUpdatesDesc: "إشعارات عند تحديث حالة الطلبات",
    passwordSettings: "تغيير كلمة المرور",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    changePassword: "تغيير كلمة المرور",
    profileTab: "الملف الشخصي",
    notificationsTab: "الإشعارات",
    passwordTab: "كلمة المرور",
  },
  fr: {
    home: "Accueil",
    dashboard: "Tableau de bord",
    pendingRequests: "Demandes en attente",
    approvedRequests: "Demandes approuvées",
    vacationDays: "Jours de congé",
    awaitingApproval: "En attente d'approbation",
    thisMonth: "Ce mois-ci",
    remaining: "Restants",
    workCertificate: "Attestation de travail",
    missionOrder: "Ordre de mission",
    vacationRequest: "Demande de congé",
    settings: "Paramètres",
    profile: "Profil",
    notifications: "Notifications",
    logout: "Déconnexion",
    search: "Rechercher",
    viewAll: "Voir tout",
    name: "Nom",
    startDate: "Date de début",
    endDate: "Date de fin",
    submit: "Soumettre",
    cancel: "Annuler",
    signatureUpload: "Télécharger la signature",
    reason: "Raison",
    type: "Type",
    description: "Description",
    save: "Enregistrer",
    requestType: "Type de demande",
    workCertificateTitle: "Demande d'attestation de travail",
    missionOrderTitle: "Demande d'ordre de mission",
    vacationRequestTitle: "Demande de congé",
    purposeLabel: "Objectif de la demande",
    purposePlaceholder: "Par exemple: Soumission à la banque, visa de voyage, etc.",
    additionalInfo: "Informations supplémentaires",
    additionalInfoPlaceholder: "Toute information supplémentaire que vous souhaitez ajouter à la demande",
    signatureUploadButton: "Choisir le fichier de signature",
    requestSubmitted: "Votre demande a été soumise avec succès !",
    requestReviewMessage: "La demande sera examinée et le certificat sera délivré dans les plus brefs délais",
    followUpMessage: "Vous pouvez suivre le statut de votre demande depuis la page d'accueil",
    newRequest: "Nouvelle demande",
    requestInfo: "Informations sur la demande",
    destination: "Destination",
    destinationPlaceholder: "Par exemple:Casablanca, Rabat, à l'étranger",
    selectDate: "Sélectionner une date",
    signature: "Signature",
    annualLeave: "Congé annuel",
    sickLeave: "Congé maladie",
    emergencyLeave: "Congé d'urgence",
    unpaidLeave: "Congé sans solde",
    vacationReasonPlaceholder: "Veuillez indiquer la raison du congé si nécessaire",
    profileSettings: "Informations du profil",
    email: "E-mail",
    phone: "Téléphone",
    saveChanges: "Enregistrer les modifications",
    notificationSettings: "Paramètres de notification",
    emailNotifications: "Notifications par e-mail",
    emailNotificationsDesc: "Recevoir des notifications par e-mail",
    newRequests: "Nouvelles demandes",
    newRequestsDesc: "Notifications lors de la création de nouvelles demandes",
    requestUpdates: "Mises à jour des demandes",
    requestUpdatesDesc: "Notifications lors de la mise à jour du statut des demandes",
    passwordSettings: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    changePassword: "Changer le mot de passe",
    profileTab: "Profil",
    notificationsTab: "Notifications",
    passwordTab: "Mot de passe",
  }
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
