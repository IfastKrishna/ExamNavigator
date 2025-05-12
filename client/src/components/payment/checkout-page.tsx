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
import { useProcessPaymentMutation, useVerifyPaymentMutation } from '@/lib/api/payments';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Receipt } from 'lucide-react';

const paymentFormSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'invoice']),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface CheckoutPageProps {
  examId: number;
  examTitle: string;
  examPrice: number;
}

export default function CheckoutPage({ examId, examTitle, examPrice }: CheckoutPageProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  
  // Use API mutations
  const processPaymentMutation = useProcessPaymentMutation();
  const verifyPaymentMutation = useVerifyPaymentMutation();
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
      quantity: 1,
    },
  });

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

  const calculateTotal = (quantity: number) => {
    return (examPrice * quantity).toFixed(2);
  };

  const onSubmit = (values: PaymentFormValues) => {
    setProcessing(true);
    
    try {
      const paymentData = {
        examId,
        quantity: values.quantity,
        paymentMethod: values.paymentMethod,
        cardDetails: values.paymentMethod === 'credit_card' ? {
          number: values.cardNumber,
          expiry: values.cardExpiry,
          cvc: values.cardCvc,
        } : undefined,
      };

      // Process the payment
      processPaymentMutation.mutate(paymentData, {
        onSuccess: (response) => {
          if (response.success) {
            // Verify the payment if needed
            if (response.paymentId) {
              verifyPaymentMutation.mutate({
                paymentId: response.paymentId,
                examId,
              }, {
                onSuccess: () => {
                  toast({
                    title: 'Purchase Successful!',
                    description: `You have successfully purchased ${values.quantity} license(s) for ${examTitle}`,
                  });
                  setProcessing(false);
                },
                onError: (error: any) => {
                  toast({
                    title: 'Verification Failed',
                    description: error.message || 'There was an issue verifying your payment',
                    variant: 'destructive',
                  });
                  setProcessing(false);
                }
              });
            } else {
              toast({
                title: 'Purchase Successful!',
                description: `You have successfully purchased ${values.quantity} license(s) for ${examTitle}`,
              });
              setProcessing(false);
            }
          } else {
            throw new Error(response.message || 'Payment failed');
          }
        },
        onError: (error: any) => {
          toast({
            title: 'Payment Failed',
            description: error.message || 'There was an issue processing your payment',
            variant: 'destructive',
          });
          setProcessing(false);
        }
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{examTitle}</CardTitle>
              <CardDescription>Complete your purchase</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Order Summary</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span>Price per license</span>
                        <span>${examPrice.toFixed(2)}</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-20 text-right"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="border-t border-border mt-2 pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span>${calculateTotal(form.watch('quantity'))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="credit_card" id="credit_card" />
                                <FormLabel htmlFor="credit_card" className="font-normal cursor-pointer flex items-center">
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Credit / Debit Card
                                </FormLabel>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="invoice" id="invoice" />
                                <FormLabel htmlFor="invoice" className="font-normal cursor-pointer flex items-center">
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Invoice (Pay Later)
                                </FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('paymentMethod') === 'credit_card' && (
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input placeholder="1234 5678 9012 3456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cardExpiry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input placeholder="MM/YY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cardCvc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVC</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={processing || processPaymentMutation.isPending}
                  >
                    {(processing || processPaymentMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Complete Purchase - $${calculateTotal(form.watch('quantity'))}`
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}