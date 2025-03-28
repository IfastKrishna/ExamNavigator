import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShoppingCart, AlertTriangle, MoreHorizontal, Tag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CheckoutPage from '@/components/payment/checkout-page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function AvailableExams() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);

  // Fetch available exams
  const {
    data: exams = [],
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: ['/api/available-exams'],
    enabled: user?.role === UserRole.ACADEMY,
  });

  if (user?.role !== UserRole.ACADEMY) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only Academy users can access the Exam Marketplace
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => setLocation('/')}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const handlePurchase = (exam: any) => {
    setSelectedExam(exam);
    setCheckoutDialogOpen(true);
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Browse and purchase exams from other academies
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/exams')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          My Exams
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 rounded-none" />
              </CardHeader>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-2/4 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load available exams. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {exams && exams.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Exams Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              There are currently no exams available for purchase. Please check back later.
            </p>
          </div>
        </Card>
      )}

      {exams && exams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam: any) => (
            <Card key={exam.id} className="overflow-hidden flex flex-col">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={exam.academyLogo || ''} />
                    <AvatarFallback>{exam.academyName?.substring(0, 2) || 'AC'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{exam.academyName}</span>
                </div>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">
                    {exam.duration} minutes
                  </Badge>
                  <Badge variant="outline">
                    Pass: {exam.passingScore}%
                  </Badge>
                </div>
                <div className="mt-2">
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-primary" />
                      <span className="font-semibold">${exam.price?.toFixed(2)}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchase(exam)}
                    >
                      Purchase
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
            <DialogDescription>
              Enter your payment information to purchase this exam
            </DialogDescription>
          </DialogHeader>
          {selectedExam && (
            <CheckoutPage 
              examId={selectedExam.id} 
              examTitle={selectedExam.title} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}