import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  examTitle?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ clientSecret, amount, examTitle, onSuccess, onCancel }: PaymentFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // For demo form fields (not actually used for payment processing)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/25');
  const [cvc, setCvc] = useState('123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Simulate a delay for "processing"
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a successful payment
      toast({
        title: 'Payment Successful',
        description: 'Your exam purchase was completed successfully!',
      });
      
      // Call the server to process the purchase (without actual payment)
      try {
        const response = await apiRequest('POST', '/api/payment/fake-process', {
          clientSecret,
        });
        
        if (!response.ok) {
          console.error('Error processing fake payment:', await response.text());
        }
      } catch (err) {
        console.error('Error calling fake payment endpoint:', err);
      }
      
      // Call success callback 
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred.');
      toast({
        title: 'Payment Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          {examTitle ? `Purchasing: ${examTitle}` : 'Exam Purchase'}
          <div className="mt-1 text-lg font-semibold">${(amount / 100).toFixed(2)}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="payment-form" onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="flex items-center border rounded-md px-3 py-2">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input 
                  id="card-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Card number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="exp-date">Expiration Date</Label>
                <Input 
                  id="exp-date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  placeholder="MM/YY"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input 
                  id="cvc"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground mt-2">
              <p>Note: This is a demo payment form. No real payment will be processed.</p>
              <p>Use any values for testing purposes.</p>
            </div>
          </div>
          
          {errorMessage && (
            <div className="text-red-500 text-sm mb-4">
              {errorMessage}
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${(amount / 100).toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}