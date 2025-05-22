
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
      className="min-w-[60px]"
    >
      {language === 'ar' ? 'FR' : 'عربي'}
    </Button>
  );
};
