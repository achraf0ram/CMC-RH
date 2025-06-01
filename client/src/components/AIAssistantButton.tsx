
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Position {
  x: number;
  y: number;
}

export const AIAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  // تهيئة الموضع الافتراضي حسب اللغة
  useEffect(() => {
    const updatePosition = () => {
      const defaultX = language === 'ar' ? window.innerWidth - 88 : 24;
      const defaultY = window.innerHeight - 88;
      setPosition({ x: defaultX, y: defaultY });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [language]);

  // بدء السحب
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  // السحب
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;

      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  // رسائل الترحيب حسب اللغة
  const getWelcomeMessage = () => {
    if (language === 'ar') {
      return `مرحباً! أنا مساعد مدينة المهن والكفاءات CMC الذكي 🤖

يمكنني مساعدتك في:
• معلومات عن الخدمات والإجراءات
• شهادات العمل والمهام
• طلبات الإجازات
• معلومات عن مدينة المهن والكفاءات

كيف يمكنني مساعدتك اليوم؟`;
    } else {
      return `Bonjour! Je suis l'assistant intelligent de la Cité des Métiers et des Compétences CMC 🤖

Je peux vous aider avec:
• Informations sur les services et procédures
• Certificats de travail et missions
• Demandes de congé
• Informations sur la Cité des Métiers et des Compétences

Comment puis-je vous aider aujourd'hui?`;
    }
  };

  // تهيئة الرسائل عند فتح النافذة لأول مرة
  const initializeMessages = () => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' 
          ? "حدث خطأ في الحصول على الاستجابة. يرجى المحاولة مرة أخرى."
          : "Une erreur s'est produite lors de l'obtention de la réponse. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ... keep existing code (generateAIResponse function)
  const generateAIResponse = async (userInput: string): Promise<string> => {
    const lowerInput = userInput.toLowerCase();
    
    if (language === 'ar') {
      // الاستجابات باللغة العربية
      if (lowerInput.includes('شهادة') || lowerInput.includes('عمل')) {
        return `📄 شهادة العمل - مدينة المهن والكفاءات CMC

يمكنك طلب شهادة العمل من خلال:
• قسم "شهادة العمل" في المنصة
• مدة المعالجة: 3-5 أيام عمل
• متطلبات: تعبئة النموذج بالبيانات الصحيحة

🏢 نبذة عن CMC:
مدينة المهن والكفاءات هي مؤسسة تعليمية رائدة تهدف إلى تطوير المهارات والكفاءات في مختلف المجالات المهنية والتقنية.

🌐 للمزيد: https://cmc.ac.ma/ar`;
      }
      
      if (lowerInput.includes('إجازة') || lowerInput.includes('عطلة')) {
        return `🏖️ طلب الإجازة - مدينة المهن والكفاءات

أنواع الإجازات المتاحة:
• إجازة سنوية عادية
• إجازة مرضية (بمبرر طبي)
• إجازة اضطرارية
• إجازة بدون راتب

📋 خطوات الطلب:
1. توجه لقسم "طلب الإجازة"
2. املأ النموذج المطلوب
3. قدم الطلب قبل أسبوعين على الأقل

✅ CMC يوفر أنواع مختلفة من الإجازات حسب القوانين المعمول بها.`;
      }
      
      if (lowerInput.includes('مهمة') || lowerInput.includes('أمر')) {
        return `🎯 أمر المهمة - مدينة المهن والكفاءات

📝 طريقة الطلب:
• قسم "أمر المهمة" في المنصة
• مدة الرد: 24-48 ساعة
• حالة الطلب: موافقة أو رفض مع التبرير

⚠️ تأكد من:
- تعبئة جميع البيانات بدقة
- تحديد الوجهة والمدة
- إرفاق المبررات اللازمة

🏢 CMC تدعم التطوير المهني والمشاركة في المؤتمرات والدورات التدريبية.`;
      }
      
      if (lowerInput.includes('cmc') || lowerInput.includes('مدينة') || lowerInput.includes('كفاءات') || lowerInput.includes('مهن')) {
        return `🏢 مدينة المهن والكفاءات (CMC)

🎯 الرسالة:
تطوير الكفاءات البشرية في مختلف المجالات المهنية والتقنية لتلبية احتياجات سوق العمل.

🌟 الخدمات الرئيسية:
• التكوين المهني والتقني
• التدريب المستمر
• التأهيل وإعادة التأهيل
• الاستشارات المهنية

🎓 البرامج التعليمية:
- برامج التكوين التقني
- ورش العمل التطبيقية
- برامج التطوير المهني
- شهادات معتمدة

🌐 المزيد من المعلومات: https://cmc.ac.ma/ar
📧 للتواصل: معلومات الاتصال متوفرة على الموقع الرسمي`;
      }
      
      return `شكراً لتواصلك مع مساعد CMC الذكي! 🤖

يمكنني مساعدتك في:
📄 طلب شهادة العمل
🏖️ طلبات الإجازات  
🎯 أوامر المهمات
🏢 معلومات عن مدينة المهن والكفاءات
📚 الخدمات والبرامج التعليمية

🌐 الموقع الرسمي: https://cmc.ac.ma/ar
💬 اكتب سؤالك وسأكون سعيداً لمساعدتك!`;
    } else {
      // الاستجابات باللغة الفرنسية
      if (lowerInput.includes('certificat') || lowerInput.includes('travail') || lowerInput.includes('attestation')) {
        return `📄 Certificat de Travail - Cité des Métiers et des Compétences

Vous pouvez demander votre certificat via:
• Section "Certificat de Travail" sur la plateforme
• Délai de traitement: 3-5 jours ouvrables
• Exigences: Remplir le formulaire avec les données exactes

🏢 À propos de CMC:
La Cité des Métiers et des Compétences est une institution éducative de premier plan visant à développer les compétences dans divers domaines professionnels et techniques.

🌐 Plus d'infos: https://cmc.ac.ma/ar`;
      }
      
      if (lowerInput.includes('congé') || lowerInput.includes('vacances')) {
        return `🏖️ Demande de Congé - Cité des Métiers et des Compétences

Types de congés disponibles:
• Congé annuel ordinaire
• Congé maladie (avec justificatif médical)
• Congé d'urgence
• Congé sans solde

📋 Étapes de demande:
1. Aller à la section "Demande de Congé"
2. Remplir le formulaire requis
3. Soumettre au moins deux semaines à l'avance

✅ CMC offre différents types de congés selon la réglementation en vigueur.`;
      }
      
      if (lowerInput.includes('mission') || lowerInput.includes('ordre')) {
        return `🎯 Ordre de Mission - Cité des Métiers et des Compétences

📝 Procédure de demande:
• Section "Ordre de Mission" sur la plateforme
• Délai de réponse: 24-48 heures
• Statut: Approbation ou refus avec justification

⚠️ Assurez-vous de:
- Remplir toutes les données avec précision
- Spécifier la destination et la durée
- Joindre les justificatifs nécessaires

🏢 CMC soutient le développement professionnel et la participation aux conférences et formations.`;
      }
      
      if (lowerInput.includes('cmc') || lowerInput.includes('cité') || lowerInput.includes('métiers') || lowerInput.includes('compétences')) {
        return `🏢 Cité des Métiers et des Compétences (CMC)

🎯 Mission:
Développer les compétences humaines dans divers domaines professionnels et techniques pour répondre aux besoins du marché du travail.

🌟 Services principaux:
• Formation professionnelle et technique
• Formation continue
• Qualification et requalification
• Conseil professionnel

🎓 Programmes éducatifs:
- Programmes de formation technique
- Ateliers pratiques
- Programmes de développement professionnel
- Certifications accréditées

🌐 Plus d'informations: https://cmc.ac.ma/ar
📧 Contact: Informations disponibles sur le site officiel`;
      }
      
      return `Merci de contacter l'assistant intelligent CMC! 🤖

Je peux vous aider avec:
📄 Demande de certificat de travail
🏖️ Demandes de congé
🎯 Ordres de mission
🏢 Informations sur la Cité des Métiers et des Compétences
📚 Services et programmes éducatifs

🌐 Site officiel: https://cmc.ac.ma/ar
💬 Écrivez votre question et je serai ravi de vous aider!`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleButtonClick = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        initializeMessages();
      }
    }
  };

  return (
    <>
      {/* الزر العائم القابل للسحب مع ألوان CMC */}
      <div 
        ref={containerRef}
        className="fixed z-50 group"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : (isOpen ? 'pointer' : 'grab')
        }}
      >
        {/* دائرة خلفية متحركة بألوان CMC */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cmc-blue via-emerald-500 to-cmc-green animate-spin opacity-75 blur-sm"></div>
        
        <Button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleButtonClick}
          className={cn(
            "relative h-16 w-16 rounded-full shadow-2xl",
            "bg-gradient-to-br from-cmc-blue via-cmc-blue-dark to-cmc-green",
            "hover:from-cmc-blue-dark hover:via-blue-700 hover:to-emerald-600",
            "transition-all duration-500 hover:scale-110 hover:shadow-3xl",
            "border-3 border-white/30 backdrop-blur-sm",
            "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-pulse",
            isDragging && "scale-110 shadow-3xl"
          )}
          size="icon"
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X size={28} className="text-white drop-shadow-lg" />
            ) : (
              <>
                <Brain size={28} className="text-white drop-shadow-lg" />
                <Sparkles 
                  size={12} 
                  className="absolute -top-2 -right-2 text-yellow-300 animate-bounce" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cmc-green rounded-full border-2 border-white animate-pulse"></div>
              </>
            )}
          </div>
        </Button>
        
        {/* نص توضيحي محسن */}
        {!isDragging && !isOpen && (
          <div className={cn(
            "absolute bottom-full mb-4 px-4 py-3 rounded-xl",
            "bg-gray-900/95 backdrop-blur-md text-white text-sm font-medium",
            "opacity-0 group-hover:opacity-100 transition-all duration-300",
            "whitespace-nowrap shadow-2xl border border-gray-700",
            "transform group-hover:scale-105",
            "pointer-events-none"
          )}>
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-cmc-blue" />
              <span>{language === 'ar' ? 'مساعد CMC الذكي (اسحب لتحريك)' : 'Assistant IA CMC (glisser pour déplacer)'}</span>
              <Sparkles size={12} className="text-cmc-green" />
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-8 border-transparent border-t-gray-900/95"></div>
          </div>
        )}

        {/* تأثير النبضة بألوان CMC */}
        <div className="absolute inset-0 rounded-full bg-cmc-blue/30 animate-ping"></div>
      </div>

      {/* نافذة المحادثة المحسنة بألوان CMC */}
      {isOpen && (
        <Card className={cn(
          "fixed w-80 md:w-96 h-[32rem] z-40",
          "cmc-card flex flex-col overflow-hidden",
          "shadow-2xl border-0 backdrop-blur-lg bg-white/95",
          "animate-scale-in"
        )}
        style={{
          left: position.x + 80 < window.innerWidth - 384 ? `${position.x + 80}px` : `${position.x - 384}px`,
          top: position.y + 512 < window.innerHeight ? `${position.y}px` : `${window.innerHeight - 512}px`
        }}
        >
          {/* رأس النافذة المحسن بألوان CMC */}
          <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-cmc-blue via-cmc-blue-dark to-cmc-green text-white">
            <div className="relative">
              <Brain size={24} className="drop-shadow-lg" />
              <Sparkles size={8} className="absolute -top-1 -right-1 text-yellow-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">
                {language === 'ar' ? 'مساعد CMC الذكي' : 'Assistant IA CMC'}
              </h3>
              <p className="text-xs opacity-90">
                {language === 'ar' ? 'مدينة المهن والكفاءات' : 'Cité des Métiers et Compétences'}
              </p>
            </div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse border border-white/50"></div>
          </div>

          {/* منطقة الرسائل */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex message-fade-in",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] p-3 rounded-xl text-sm leading-relaxed",
                      message.isUser
                        ? "bg-gradient-to-r from-cmc-blue to-cmc-green text-white rounded-br-none shadow-lg"
                        : "bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100 shadow-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p className={cn(
                      "text-xs mt-2 opacity-70",
                      message.isUser ? "text-blue-100" : "text-gray-500"
                    )}>
                      {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 p-3 rounded-xl rounded-bl-none border border-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cmc-blue rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cmc-blue-dark rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-cmc-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* منطقة الإدخال المحسنة */}
          <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'ar' ? "اكتب رسالتك هنا..." : "Tapez votre message ici..."}
                className="flex-1 cmc-input border-gray-200 focus:border-cmc-blue rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-cmc-blue to-cmc-green hover:from-cmc-blue-dark hover:to-emerald-600 rounded-xl h-10 w-10 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
