import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { StripeProvider } from '@/hooks/use-stripe-provider';
import PaymentForm from '@/components/payment/payment-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CheckoutPageProps {
  examId: number;
  examTitle: string;
}

export default function CheckoutPage({ examId, examTitle }: CheckoutPageProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('POST', '/api/payment/create-intent', {
          examId
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to set up payment');
        toast({
          title: 'Payment Setup Failed',
          description: err.message || 'Failed to set up payment',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    getPaymentIntent();
  }, [examId, toast]);

  const handleSuccess = () => {
    toast({
      title: 'Payment Successful',
      description: 'Your exam purchase was completed successfully.',
    });
    // Redirect to exams page after success
    setLocation('/exams');
  };

  const handleCancel = () => {
    // Redirect back to the exam details or available exams
    setLocation('/available-exams');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Setting up payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Setup Failed</CardTitle>
          <CardDescription>
            We encountered an error while setting up your payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 mb-4">{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCancel} className="w-full">
            Return to Available Exams
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      {clientSecret && (
        <StripeProvider>
          <PaymentForm 
            clientSecret={clientSecret}
            amount={amount}
            examTitle={examTitle}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </StripeProvider>
      )}
    </div>
  );
}