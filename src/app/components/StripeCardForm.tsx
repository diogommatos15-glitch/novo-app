"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#111827",
      fontFamily: "inherit",
      "::placeholder": { color: "#9CA3AF" },
    },
    invalid: { color: "#EF4444" },
  },
};

interface CardFormInnerProps {
  clientSecret: string;
  cardholderName: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  processing: boolean;
  setProcessing: (v: boolean) => void;
  finalPrice: number;
  currencySymbol: string;
}

function CardFormInner({
  clientSecret,
  cardholderName,
  onSuccess,
  onError,
  processing,
  setProcessing,
  finalPrice,
  currencySymbol,
}: CardFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      onError("Stripe não carregou. Recarregue a página e tente novamente.");
      return;
    }

    setProcessing(true);

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setProcessing(false);
      onError("Campos do cartão não encontrados. Recarregue a página.");
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: { name: cardholderName || "Cliente" },
      },
    });

    if (error) {
      setProcessing(false);
      onError(error.message || "Pagamento recusado. Verifique os dados do cartão.");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      setProcessing(false);
      onError("O pagamento não foi confirmado. Tente novamente.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="dark:text-white text-sm font-medium">Número do Cartão</Label>
        <div className="mt-1 border-2 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 dark:border-gray-600 focus-within:border-emerald-500 transition-all">
          <CardNumberElement options={ELEMENT_OPTIONS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="dark:text-white text-sm font-medium">Validade</Label>
          <div className="mt-1 border-2 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 dark:border-gray-600 focus-within:border-emerald-500 transition-all">
            <CardExpiryElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
        <div>
          <Label className="dark:text-white text-sm font-medium">CVV</Label>
          <div className="mt-1 border-2 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 dark:border-gray-600 focus-within:border-emerald-500 transition-all">
            <CardCvcElement options={ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={processing || !stripe || !elements}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            A processar pagamento...
          </span>
        ) : (
          `Pagar ${currencySymbol} ${finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        Pagamento seguro processado pelo Stripe. Os seus dados são encriptados.
      </p>
    </div>
  );
}

interface StripeCardFormProps {
  clientSecret: string;
  cardholderName: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  processing: boolean;
  setProcessing: (v: boolean) => void;
  finalPrice: number;
  currencySymbol: string;
  publishableKey: string;
}

export default function StripeCardForm({ publishableKey, clientSecret, ...props }: StripeCardFormProps) {
  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardFormInner clientSecret={clientSecret} {...props} />
    </Elements>
  );
}
