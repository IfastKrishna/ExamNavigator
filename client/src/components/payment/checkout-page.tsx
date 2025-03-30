import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import PaymentForm from '@/components/payment/payment-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Minus, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface CheckoutPageProps {
  examId: number;
  examTitle: string;
  examPrice?: number; // Add optional price for direct display
}

export default function CheckoutPage({ examId, examTitle, examPrice }: CheckoutPageProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('POST', '/api/payment/create-intent', {
          examId,
          quantity
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
  }, [examId, quantity, toast]);

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

  // Handle quantity increment/decrement
  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 100)); // Set a reasonable maximum
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1)); // Minimum 1
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setQuantity(value);
    }
  };

  const estimatedPrice = examPrice ? examPrice * quantity : amount / 100;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{examTitle}</h3>
                <p className="text-sm text-muted-foreground">Online Exam License</p>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center mt-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    type="button" 
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min={1}
                    max={100}
                    className="w-16 mx-2 text-center"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    type="button" 
                    onClick={incrementQuantity}
                    disabled={quantity >= 100}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-medium">
                <span>Total Price:</span>
                <span>{formatCurrency(estimatedPrice)}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>This purchase includes:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>{quantity} license(s) to assign to students</li>
                  <li>Full access to exam content</li>
                  <li>Ability to view student results</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <PaymentForm 
            clientSecret={clientSecret || 'fake-secret'}
            amount={amount}
            examTitle={`${examTitle} (${quantity} license${quantity > 1 ? 's' : ''})`}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}