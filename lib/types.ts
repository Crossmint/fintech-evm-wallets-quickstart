export interface CreateOrderRequest {
  amount: string;
  receiptEmail: string;
  walletAddress: string;
}

export interface CreateOrderResponse {
  order: {
    orderId: string;
    lineItems: Array<{
      tokenLocator: string;
      executionParameters: {
        mode: string;
        amount: string;
      };
      quote?: {
        inputAmount: number;
        outputAmount: number;
        feeAmount: number;
        totalAmount: number;
      };
    }>;
    recipient: {
      walletAddress: string;
    };
    payment: {
      method: string;
      receiptEmail: string;
    };
    phase: string;
  };
  clientSecret: string;
}
