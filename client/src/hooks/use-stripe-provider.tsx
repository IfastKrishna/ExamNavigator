import { ReactNode } from 'react';

// Note: Stripe has been removed, this is a simplified provider that just passes children through

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  // Just pass children through, we're not using Stripe anymore
  return <>{children}</>;
}