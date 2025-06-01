
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
});

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Password reset request:", values);
      
      setIsEmailSent(true);
      toast({
        title: "تم إرسال الرابط",
        description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen cmc-page-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="cmc-card">
            <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8">
              <div className="flex flex-col items-center text-center gap-4 md:gap-6">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-cmc-green-light to-emerald-100 flex items-center justify-center shadow-lg">
                  <Mail className="h-8 w-8 md:h-10 md:w-10 text-cmc-green" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-slate-800">تم إرسال الرابط</h2>
                  <p className="text-slate-600 leading-relaxed mb-4 md:mb-6 text-sm md:text-base">
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.
                  </p>
                  <Link to="/Login">
                    <Button className="cmc-button-primary px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm md:text-base">
                      العودة إلى تسجيل الدخول
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cmc-page-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cmc-blue-light to-cmc-green-light rounded-full mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-cmc-blue" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">نسيت كلمة المرور</h1>
          <p className="text-slate-600">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
        </div>

        <Card className="cmc-card">
          <CardHeader className="cmc-gradient text-white rounded-t-lg p-6">
            <CardTitle className="text-xl font-semibold text-center">إعادة تعيين كلمة المرور</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@ofppt.ma"
                          className="cmc-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full cmc-button-primary py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                </Button>

                <div className="text-center">
                  <Link
                    to="/Login"
                    className="inline-flex items-center gap-2 text-cmc-blue hover:text-cmc-blue-dark font-medium transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    العودة إلى تسجيل الدخول
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
