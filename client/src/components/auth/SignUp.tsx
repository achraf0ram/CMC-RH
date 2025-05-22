import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await register(name, email, password, password_confirmation);

      if (result.success) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "مرحباً بك في منصة CMC",
        });
        navigate("/");
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في إنشاء الحساب",
          description:
            Object.values(result.errors || {})
              .flat()
              .join(", ") || "حدث خطأ غير معروف",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الحساب",
        description:
          error.response?.data?.message ||
          "حدث خطأ أثناء محاولة إنشاء الحساب. يرجى المحاولة مرة أخرى",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <img
            src="/lovable-uploads/61196920-7ed5-45d7-af8f-330e58178ad2.png"
            alt="CMC"
            className="mx-auto h-16 w-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-[#0FA0CE]">CMC</h2>
          <p className="text-gray-600 mt-2">منصة إدارة طلبات الموارد البشرية</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="أدخل الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 pr-4"
                required
                dir="rtl"
              />
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="أدخل البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 pr-4"
                required
                dir="rtl"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-4"
                required
                dir="rtl"
                minLength={8}
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type="password"
                placeholder="أدخل تأكيد كلمة المرور"
                value={password_confirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="pl-10 pr-4"
                required
                dir="rtl"
                minLength={8}
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : (
              "إنشاء حساب"
            )}
          </Button>

          <div className="text-center mt-4 text-sm">
            لديك حساب بالفعل؟{" "}
            <Button
              variant="link"
              className="p-0 text-[#0EA5E9]"
              onClick={() => navigate("/login")}
            >
              تسجيل الدخول
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
