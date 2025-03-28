import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  const [_, setLocation] = useLocation();

  const goToAvailableExams = () => {
    setLocation('/available-exams');
  };

  return (
    <div className="container py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            Your payment has been cancelled. No charges were made.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            You can try again whenever you're ready.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={goToAvailableExams} className="w-full">
            Return to Available Exams
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}