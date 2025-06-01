
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen cmc-page-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-cmc-blue-light to-cmc-green-light rounded-full mb-6 shadow-lg">
            <span className="text-3xl md:text-4xl font-bold text-cmc-blue">404</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            الصفحة غير موجودة
          </h1>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
            عذراً، لا يمكن العثور على الصفحة التي تبحث عنها. قد تكون محذوفة أو منقولة أو أن الرابط غير صحيح.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="cmc-button-primary">
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" />
                العودة للرئيسية
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="border-cmc-blue text-cmc-blue hover:bg-cmc-blue-light/30">
              <Link to="/vacation-request" className="inline-flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                طلب إجازة
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
