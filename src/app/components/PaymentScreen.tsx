"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft, CheckCircle2, CreditCard, Shield, Sparkles,
  DollarSign, Euro, Phone, AlertCircle, Clock, RefreshCw
} from "lucide-react";

// Carrega Stripe Elements dinamicamente (sem SSR) para evitar erros
const StripeCardForm = dynamic(() => import("./StripeCardForm"), { ssr: false });

interface PaymentScreenProps {
  userData: any;
  onComplete: () => void;
  onBack: () => void;
}

type PaymentStatus =
  | "idle"
  | "processing"
  | "waiting_card"
  | "waiting_mbway"
  | "waiting_pix"
  | "succeeded"
  | "failed";

export default function PaymentScreen({ userData, onComplete, onBack }: PaymentScreenProps) {
  const [currency, setCurrency] = useState<"BRL" | "USD" | "EUR">("EUR");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [paymentMethod, setPaymentMethod] = useState("mbway");
  const [cardholderName, setCardholderName] = useState("");
  const [mbwayPhone, setMbwayPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentError, setPaymentError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [pixData, setPixData] = useState<{ qrCode?: string; code?: string } | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [cardProcessing, setCardProcessing] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Preços base em cada moeda
  const prices = {
    BRL: { monthly: 49.90, annual: 497, symbol: "R$" },
    USD: { monthly: 9.90, annual: 97, symbol: "$" },
    EUR: { monthly: 8.90, annual: 89, symbol: "€" },
  };

  const currentPrice = prices[currency];
  const price = billingPeriod === "annual" ? currentPrice.annual : currentPrice.monthly;
  const monthlyEquivalent = billingPeriod === "annual"
    ? (currentPrice.annual / 12).toFixed(2)
    : currentPrice.monthly.toFixed(2);
  const currencySymbol = currentPrice.symbol;
  const savingsAmount = billingPeriod === "annual"
    ? (currentPrice.monthly * 12 - currentPrice.annual).toFixed(2)
    : "0";
  const savingsPercentage = billingPeriod === "annual"
    ? Math.round(((currentPrice.monthly * 12 - currentPrice.annual) / (currentPrice.monthly * 12)) * 100)
    : 0;

  const finalPrice = paymentMethod === "pix" && currency === "BRL" ? price * 0.95 : price;

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const saveAndComplete = () => {
    if (userData?.contact) {
      const accounts = JSON.parse(localStorage.getItem("nutrilife_accounts") || "{}");
      accounts[userData.contact] = { ...userData, paidAt: new Date().toISOString(), hasPaid: true };
      localStorage.setItem("nutrilife_accounts", JSON.stringify(accounts));
    }
    setTimeout(() => onComplete(), 1800);
  };

  const startPolling = (intentId: string) => {
    let count = 0;
    pollRef.current = setInterval(async () => {
      count++;
      setPollCount(count);
      if (count > 36) {
        stopPolling();
        setPaymentStatus("failed");
        setPaymentError("Tempo expirado. O pagamento não foi confirmado. Tente novamente.");
        return;
      }
      try {
        const res = await fetch("/api/check-payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: intentId }),
        });
        const data = await res.json();
        if (data.status === "succeeded") {
          stopPolling();
          setPaymentStatus("succeeded");
          saveAndComplete();
        } else if (data.status === "canceled" || data.status === "requires_payment_method") {
          stopPolling();
          setPaymentStatus("failed");
          setPaymentError("Pagamento cancelado ou recusado. Tente novamente.");
        }
      } catch { /* continua */ }
    }, 5000);
  };

  const validate = (): string => {
    if (paymentMethod === "credit-card" && !cardholderName.trim())
      return "Por favor, insira o nome do titular do cartão.";
    if (paymentMethod === "mbway") {
      const cleaned = mbwayPhone.replace(/[\s\-\(\)]/g, "");
      if (!cleaned || !/^\+?[0-9]{9,15}$/.test(cleaned))
        return "Por favor, insira um número de telemóvel válido (ex: +351912345678).";
    }
    return "";
  };

  // Para cartão: apenas cria o PaymentIntent e expõe o clientSecret ao Elements
  const handleInitCardPayment = async () => {
    setPaymentError("");
    const err = validate();
    if (err) { setPaymentError(err); return; }

    setPaymentStatus("processing");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPrice,
          currency,
          paymentMethod: "credit-card",
          billingPeriod,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPaymentStatus("failed");
        setPaymentError(data.error || "Erro ao iniciar pagamento. Tente novamente.");
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setPaymentStatus("waiting_card");
    } catch (e: any) {
      setPaymentStatus("failed");
      setPaymentError(e.message || "Erro de conexão. Tente novamente.");
    }
  };

  // Para MBWay e PIX: envia e faz polling
  const handleOtherPayment = async () => {
    setPaymentError("");
    const err = validate();
    if (err) { setPaymentError(err); return; }

    setPaymentStatus("processing");
    try {
      const body: any = { amount: finalPrice, currency, paymentMethod, billingPeriod };
      if (paymentMethod === "mbway") {
        let phone = mbwayPhone.replace(/[\s\-\(\)]/g, "");
        if (!phone.startsWith("+")) phone = "+351" + phone;
        body.phone = phone;
      }

      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPaymentStatus("failed");
        setPaymentError(data.error || "Erro ao iniciar pagamento. Tente novamente.");
        return;
      }

      setPaymentIntentId(data.paymentIntentId);
      if (paymentMethod === "mbway") {
        setPaymentStatus("waiting_mbway");
        startPolling(data.paymentIntentId);
      } else if (paymentMethod === "pix") {
        setPaymentStatus("waiting_pix");
        setPixData({ qrCode: data.pixQrCode, code: data.pixCode });
        startPolling(data.paymentIntentId);
      }
    } catch (e: any) {
      setPaymentStatus("failed");
      setPaymentError(e.message || "Erro de conexão. Tente novamente.");
    }
  };

  const handlePayment = () => {
    if (paymentMethod === "credit-card") handleInitCardPayment();
    else handleOtherPayment();
  };

  const handleRetry = () => {
    stopPolling();
    setPaymentStatus("idle");
    setPaymentError("");
    setClientSecret("");
    setPaymentIntentId("");
    setPixData(null);
    setPollCount(0);
    setCardProcessing(false);
  };

  // --- Ecrãs de estado ---

  if (paymentStatus === "succeeded") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-gray-900">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamento Confirmado!</h2>
          <p className="text-gray-600 dark:text-gray-300">O seu acesso ao NutriLife está ativo. A redirecionar para o painel...</p>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "waiting_mbway") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto">
            <Phone className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aguardando Confirmação</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Uma notificação foi enviada para <strong>{mbwayPhone}</strong>.<br /><br />
            Abra o MB WAY e aceite o pagamento de <strong>{currencySymbol} {finalPrice.toFixed(2)}</strong>.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>A verificar... ({Math.max(0, 180 - pollCount * 5)}s restantes)</span>
          </div>
          <Button variant="outline" onClick={handleRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />Cancelar
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Não recebeu? Certifique-se de que o número está correto e tem saldo disponível.
          </p>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "waiting_pix") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800">
          <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pague via PIX</h2>
          {pixData?.qrCode && (
            <img src={pixData.qrCode} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-xl border" />
          )}
          {pixData?.code && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ou copie o código PIX:</p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xs text-gray-800 dark:text-gray-200 break-all font-mono">{pixData.code}</div>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(pixData?.code || "")}>
                Copiar Código PIX
              </Button>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" /><span>A aguardar confirmação...</span>
          </div>
          <Button variant="outline" onClick={handleRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />Cancelar
          </Button>
        </Card>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamento Falhado</h2>
          <p className="text-gray-600 dark:text-gray-300">{paymentError}</p>
          <Button onClick={handleRetry} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            Tentar Novamente
          </Button>
        </Card>
      </div>
    );
  }

  // --- Formulário principal ---
  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" onClick={onBack} className="mb-6 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />Voltar ao Questionário
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Esquerda — Plano */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Escolha Seu Plano Premium</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">Acesso completo a todas as funcionalidades</p>
            </div>

            {/* Período */}
            <Card className="p-6 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
              <Label className="text-base font-semibold mb-3 block dark:text-white">Período de Cobrança:</Label>
              <RadioGroup value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "annual")} className="grid grid-cols-2 gap-4">
                <div className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${billingPeriod === "monthly" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                  <Label htmlFor="monthly" className="cursor-pointer text-center block space-y-2">
                    <div className="font-bold text-2xl dark:text-white">Mensal</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pague mensalmente</div>
                  </Label>
                </div>
                <div className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${billingPeriod === "annual" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="annual" id="annual" className="sr-only" />
                  <Label htmlFor="annual" className="cursor-pointer text-center block space-y-2">
                    <div className="font-bold text-2xl dark:text-white">Anual</div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Economize {savingsPercentage}%</div>
                  </Label>
                  {billingPeriod === "annual" && (
                    <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">MELHOR OFERTA</div>
                  )}
                </div>
              </RadioGroup>
            </Card>

            {/* Moeda */}
            <Card className="p-6 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
              <Label className="text-base font-semibold mb-3 block dark:text-white">Escolha sua moeda:</Label>
              <RadioGroup
                value={currency}
                onValueChange={(v) => {
                  setCurrency(v as "BRL" | "USD" | "EUR");
                  if (v === "EUR") setPaymentMethod("mbway");
                  else if (v === "BRL") setPaymentMethod("pix");
                  else setPaymentMethod("credit-card");
                }}
                className="grid grid-cols-3 gap-3"
              >
                {(["BRL", "USD", "EUR"] as const).map((c) => (
                  <div key={c} className={`flex items-center justify-center border-2 rounded-lg p-4 cursor-pointer transition-all ${currency === c ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                    <RadioGroupItem value={c} id={c} className="sr-only" />
                    <Label htmlFor={c} className="cursor-pointer text-center w-full">
                      <div className="flex items-center justify-center gap-1">
                        {c === "BRL" && <span className="font-bold text-lg dark:text-white">R$</span>}
                        {c === "USD" && <><DollarSign className="w-5 h-5 dark:text-white" /><span className="font-bold text-lg dark:text-white">USD</span></>}
                        {c === "EUR" && <><Euro className="w-5 h-5 dark:text-white" /><span className="font-bold text-lg dark:text-white">EUR</span></>}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{c === "BRL" ? "Real" : c === "USD" ? "Dólar" : "Euro"}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            {/* Preço */}
            <Card className="p-8 bg-emerald-600 dark:bg-emerald-700 text-white">
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{currencySymbol} {finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)}</span>
                  <span className="text-xl opacity-90">/{billingPeriod === "annual" ? "ano" : "mês"}</span>
                </div>
                {billingPeriod === "annual" && <p className="text-emerald-100 text-lg">Apenas {currencySymbol} {monthlyEquivalent}/mês</p>}
                {billingPeriod === "annual" && (
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm opacity-90">Economize {currencySymbol} {savingsAmount} comparado ao plano mensal</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">O que está incluído:</h3>
              <div className="space-y-3">
                {[
                  "Plano alimentar personalizado",
                  "Contador automático de calorias e macros",
                  "Receitas saudáveis exclusivas",
                  "Acompanhamento diário de progresso",
                  "Relatórios semanais detalhados",
                  "Suporte profissional via chat",
                  "Acesso à comunidade exclusiva",
                  "Garantia de 30 dias - satisfação total",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Direita — Formulário */}
          <div className="space-y-6">
            <Card className="p-8 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Informações de Pagamento</h2>
                  <p className="text-gray-600 dark:text-gray-300">Complete o seu cadastro e comece hoje</p>
                </div>

                {paymentError && (
                  <Card className="p-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-red-900 dark:text-red-100 mb-1">Erro no Pagamento</p>
                        <p className="text-red-700 dark:text-red-300">{paymentError}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Método de Pagamento */}
                <div>
                  <Label className="text-base font-semibold mb-3 block dark:text-white">Método de Pagamento</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    {/* Cartão — sempre disponível */}
                    <div className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "credit-card" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium dark:text-white">Cartão de Crédito</span>
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full ml-auto">Mundial</span>
                      </Label>
                    </div>

                    {/* MBWay — só EUR */}
                    {currency === "EUR" && (
                      <div className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "mbway" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                        <RadioGroupItem value="mbway" id="mbway" />
                        <Label htmlFor="mbway" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium dark:text-white">MB WAY</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full ml-auto">Portugal</span>
                        </Label>
                      </div>
                    )}

                    {/* PIX — só BRL */}
                    {currency === "BRL" && (
                      <div className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "pix" ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          <span className="font-medium dark:text-white">PIX</span>
                          <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full ml-auto">5% desconto</span>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {/* Formulário Cartão com Stripe Elements */}
                {paymentMethod === "credit-card" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardName" className="dark:text-white">Nome do Titular</Label>
                      <Input
                        id="cardName"
                        placeholder="Nome como está no cartão"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    {/* Se já temos o clientSecret, mostra o Stripe Elements */}
                    {paymentStatus === "waiting_card" && clientSecret ? (
                      <StripeCardForm
                        clientSecret={clientSecret}
                        cardholderName={cardholderName}
                        finalPrice={finalPrice}
                        currencySymbol={currencySymbol}
                        processing={cardProcessing}
                        setProcessing={setCardProcessing}
                        onSuccess={() => {
                          setPaymentStatus("succeeded");
                          saveAndComplete();
                        }}
                        onError={(msg) => {
                          setPaymentStatus("failed");
                          setPaymentError(msg);
                        }}
                      />
                    ) : (
                      <>
                        <div className="space-y-3 opacity-60 pointer-events-none select-none">
                          <div>
                            <Label className="dark:text-white text-sm font-medium">Número do Cartão</Label>
                            <div className="mt-1 border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-400 text-sm">
                              Clique em "Prosseguir" para inserir os dados do cartão de forma segura
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="dark:text-white text-sm font-medium">Validade</Label>
                              <div className="mt-1 border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-400 text-sm">MM / AA</div>
                            </div>
                            <div>
                              <Label className="dark:text-white text-sm font-medium">CVV</Label>
                              <div className="mt-1 border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-400 text-sm">•••</div>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handlePayment}
                          disabled={paymentStatus === "processing"}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
                        >
                          {paymentStatus === "processing" ? (
                            <span className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              A preparar pagamento seguro...
                            </span>
                          ) : (
                            "Prosseguir para Pagamento Seguro"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* MB WAY */}
                {paymentMethod === "mbway" && currency === "EUR" && (
                  <Card className="p-6 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">Pagamento via MB WAY</p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Receberá uma notificação real no seu telemóvel</p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="mbwayPhone" className="dark:text-white">Número de Telemóvel</Label>
                        <Input id="mbwayPhone" placeholder="+351 912 345 678" value={mbwayPhone}
                          onChange={(e) => setMbwayPhone(e.target.value)}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Insira com indicativo (+351 para Portugal)</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* PIX info */}
                {paymentMethod === "pix" && currency === "BRL" && (
                  <Card className="p-6 bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-200 dark:border-teal-700">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="font-semibold text-teal-900 dark:text-teal-100">Pagamento via PIX</p>
                        <p className="text-sm text-teal-700 dark:text-teal-300">Com 5% de desconto — R$ {finalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">Após confirmar, receberá o QR Code para pagamento instantâneo.</p>
                  </Card>
                )}

                {/* Resumo + Botão (para mbway e pix) */}
                <div className="border-t dark:border-gray-600 pt-6 space-y-3">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Plano {billingPeriod === "annual" ? "Anual" : "Mensal"}</span>
                    <span>{currencySymbol} {price}</span>
                  </div>
                  {paymentMethod === "pix" && currency === "BRL" && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Desconto PIX (5%)</span>
                      <span>- {currencySymbol} {(price * 0.05).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t dark:border-gray-600">
                    <span>Total</span>
                    <span>{currencySymbol} {finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botão apenas para mbway e pix (cartão tem seu próprio botão) */}
                {paymentMethod !== "credit-card" && (
                  <Button
                    onClick={handlePayment}
                    disabled={paymentStatus === "processing"}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
                  >
                    {paymentStatus === "processing" ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        A processar...
                      </span>
                    ) : (
                      "Finalizar Pagamento"
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Ao finalizar, você concorda com os nossos Termos de Uso e Política de Privacidade
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Pagamento 100% Seguro via Stripe</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Processado pelo Stripe — líder mundial em pagamentos. Aceita cartões Visa, Mastercard, American Express e mais de 135 moedas.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
