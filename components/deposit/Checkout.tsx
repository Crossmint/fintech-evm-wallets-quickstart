import { CrossmintEmbeddedCheckout, useCrossmintCheckout } from "@crossmint/client-sdk-react-ui";
import { useEffect, useState } from "react";
import { AmountBreakdown } from "./AmountBreakdown";
import { cn } from "@/lib/utils";
import { CreateOrderResponse } from "@/lib/types";

const CHECKOUT_APPEARANCE = {
  rules: {
    Label: {
      font: {
        family: "Inter, sans-serif",
        size: "14px",
        weight: "500",
      },
      colors: {
        text: "#374151",
      },
    },
    Input: {
      borderRadius: "8px",
      font: {
        family: "Inter, sans-serif",
        size: "16px",
        weight: "400",
      },
      colors: {
        text: "#000000",
        background: "#FFFFFF",
        border: "#E0E0E0",
        boxShadow: "none",
        placeholder: "#999999",
      },
      hover: {
        colors: {
          border: "#0074D9",
        },
      },
      focus: {
        colors: {
          border: "#0074D9",
          boxShadow: "none",
        },
      },
    },
    PrimaryButton: {
      font: {
        family: "Inter, sans-serif",
      },
      colors: {
        background: "#0D42E4",
      },
      hover: {
        colors: {
          background: "#0A2FA2",
        },
      },
      disabled: {
        colors: {
          background: "#F1F5F9",
        },
      },
    },
    DestinationInput: {
      display: "hidden",
    },
    ReceiptEmailInput: {
      display: "hidden",
    },
  },
  variables: {
    colors: {
      accent: "#0D42E4",
    },
  },
} as const;

type CheckoutProps = {
  amount: string;
  walletAddress: string;
  onPaymentCompleted: () => void;
  receiptEmail: string;
  onProcessingPayment: () => void;
  isAmountValid: boolean;
  step: "options" | "processing" | "completed";
};

export function Checkout({
  amount,
  walletAddress,
  onPaymentCompleted,
  receiptEmail,
  onProcessingPayment,
  isAmountValid,
  step,
}: CheckoutProps) {
  const { order } = useCrossmintCheckout();
  const [orderId, setOrderId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string>("");

  useEffect(() => {
    const createOrder = async () => {
      if (!amount || !isAmountValid || orderId || isCreatingOrder) {
        return;
      }

      setIsCreatingOrder(true);
      setOrderError("");

      try {
        const response = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            receiptEmail,
            walletAddress,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create order");
        }

        const orderData = await response.json() as CreateOrderResponse;
        setOrderId(orderData.order.orderId);
        setClientSecret(orderData.clientSecret);
      } catch (error) {
        console.error("Error creating order:", error);
        setOrderError(error instanceof Error ? error.message : "Failed to create order");
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrder();
  }, [amount, isAmountValid, orderId, isCreatingOrder, receiptEmail, walletAddress]);

  useEffect(() => {
    if (order?.phase === "completed") {
      onPaymentCompleted();
    }
    if (order?.phase === "delivery") {
      onProcessingPayment();
    }
  }, [order, onPaymentCompleted, onProcessingPayment]);

  return (
    <div className={cn("w-full flex-grow space-y-4", step !== "options" && "flex items-center")}>
      {step === "options" && (
        <AmountBreakdown
          quote={order?.lineItems[0].quote}
          inputAmount={amount ? Number.parseFloat(amount) : 0}
          isAmountValid={isAmountValid}
        />
      )}
      {orderError && (
        <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
          {orderError}
        </div>
      )}
      
      {isCreatingOrder && (
        <div className="text-center text-gray-600 p-4">
          Creating order...
        </div>
      )}

      {amount && isAmountValid && orderId && clientSecret && !isCreatingOrder && !orderError && (
        <CrossmintEmbeddedCheckout
          orderId={orderId}
          // @ts-ignore
          clientSecret={clientSecret}
          payment={{
            receiptEmail,
            crypto: { enabled: false },
            fiat: { enabled: true },
            defaultMethod: "fiat",
          }}
          appearance={CHECKOUT_APPEARANCE}
        />
      )}
    </div>
  );
}
