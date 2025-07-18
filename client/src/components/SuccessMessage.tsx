
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface SuccessMessageProps {
  title: string;
  description: string;
  primaryButtonText: string;
  onPrimary: () => void;
  secondaryButtonText?: string;
  onSecondary?: () => void;
}

export const SuccessMessage = ({
  title,
  description,
  primaryButtonText,
  onPrimary,
  secondaryButtonText,
  onSecondary,
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
            <div className="flex flex-col md:flex-row gap-3 mt-4 justify-center">
              <Button onClick={onPrimary}>{primaryButtonText}</Button>
              {secondaryButtonText && onSecondary && (
                <Button variant="outline" onClick={onSecondary}>
                  {secondaryButtonText}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
