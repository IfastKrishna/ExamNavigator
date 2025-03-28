import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get session_id from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          throw new Error('Session ID not found');
        }
        
        // Verify the payment with our backend
        const response = await apiRequest('GET', `/api/payment/session/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Could not verify payment');
        }
        
        const data = await response.json();
        setSessionData(data.session);
        
        toast({
          title: 'Payment Successful',
          description: 'Your exam purchase was completed successfully.',
        });
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        toast({
          title: 'Verification Failed',
          description: err.message || 'Failed to verify payment',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [toast]);

  const goToExams = () => {
    setLocation('/exams');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying your payment...</span>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            Thank you for your purchase. The exam has been added to your academy.
          </p>
          {sessionData && (
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-sm">
              <p><strong>Transaction ID:</strong> {sessionData.id}</p>
              <p><strong>Amount:</strong> ${sessionData.amount_total / 100}</p>
              <p><strong>Status:</strong> {sessionData.payment_status}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={goToExams} className="w-full">
            Go to My Exams
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}