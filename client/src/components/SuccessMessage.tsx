
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SuccessMessageProps {
  title: string;
  description: string;
  buttonText: string;
  onReset: () => void;
}

export const SuccessMessage = ({
  title,
  description,
  buttonText,
  onReset
}: SuccessMessageProps) => {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
            <Button className="mt-4" onClick={onReset}>
              {buttonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
