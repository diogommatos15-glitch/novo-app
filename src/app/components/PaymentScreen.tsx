"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, CheckCircle2, CreditCard, Shield, Sparkles,
  Phone, AlertCircle, Clock, RefreshCw, Star, Lock, Zap, Award
} from "lucide-react";

const StripeCardForm = dynamic(() => import("./StripeCardForm"), { ssr: false });

interface PaymentScreenProps {
  userData: any;
  onComplete: () => void;
  onBack: () => void;
}

type PaymentStatus =
  | "idle" | "processing" | "waiting_card"
  | "waiting_mbway" | "waiting_pix" | "succeeded" | "failed";

type Currency = "EUR" | "BRL" | "USD";
type BillingPeriod = "monthly" | "annual";

const prices = {
  EUR: { monthly: 8.90, annual: 89, symbol: "€", flag: "🇪🇺" },
  BRL: { monthly: 49.90, annual: 497, symbol: "R$", flag: "🇧🇷" },
  USD: { monthly: 9.90, annual: 97, symbol: "$", flag: "🇺🇸" },
};

export default function PaymentScreen({ userData, onComplete, onBack }: PaymentScreenProps) {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
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

  const currentPrice = prices[currency];
  const price = billingPeriod === "annual" ? currentPrice.annual : currentPrice.monthly;
  const monthlyEquivalent = billingPeriod === "annual"
    ? (currentPrice.annual / 12).toFixed(2)
    : currentPrice.monthly.toFixed(2);
  const currencySymbol = currentPrice.symbol;
  const savingsAmount = billingPeriod === "annual"
    ? (currentPrice.monthly * 12 - currentPrice.annual).toFixed(2) : "0";
  const savingsPercentage = billingPeriod === "annual"
    ? Math.round(((currentPrice.monthly * 12 - currentPrice.annual) / (currentPrice.monthly * 12)) * 100) : 0;
  const finalPrice = paymentMethod === "pix" && currency === "BRL" ? price * 0.95 : price;

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
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
      count++; setPollCount(count);
      if (count > 36) { stopPolling(); setPaymentStatus("failed"); setPaymentError("Tempo expirado. Tente novamente."); return; }
      try {
        const res = await fetch("/api/check-payment-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentIntentId: intentId }) });
        const data = await res.json();
        if (data.status === "succeeded") { stopPolling(); setPaymentStatus("succeeded"); saveAndComplete(); }
        else if (data.status === "canceled" || data.status === "requires_payment_method") { stopPolling(); setPaymentStatus("failed"); setPaymentError("Pagamento cancelado. Tente novamente."); }
      } catch { /* continua */ }
    }, 5000);
  };

  const validate = (): string => {
    if (paymentMethod === "mbway") {
      const cleaned = mbwayPhone.replace(/[\s\-\(\)]/g, "");
      if (!cleaned || !/^\+?[0-9]{9,15}$/.test(cleaned))
        return "Insira um número de telemóvel válido (ex: +351912345678).";
    }
    return "";
  };

  const handleInitCardPayment = async () => {
    setPaymentError("");
    setPaymentStatus("processing");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalPrice, currency, paymentMethod: "credit-card", billingPeriod }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setPaymentStatus("failed"); setPaymentError(`Erro Stripe: ${data.error || "Erro desconhecido"} (status: ${res.status})`); return; }
      setClientSecret(data.clientSecret); setPaymentIntentId(data.paymentIntentId); setPaymentStatus("waiting_card");
    } catch (e: any) { setPaymentStatus("failed"); setPaymentError(`Erro de conexão: ${e.message}`); }
  };

  const handleOtherPayment = async () => {
    setPaymentError("");
    const err = validate();
    if (err) { setPaymentError(err); return; }
    setPaymentStatus("processing");
    try {
      const body: any = { amount: finalPrice, currency, paymentMethod, billingPeriod };
      if (paymentMethod === "mbway") { let phone = mbwayPhone.replace(/[\s\-\(\)]/g, ""); if (!phone.startsWith("+")) phone = "+351" + phone; body.phone = phone; }
      const res = await fetch("/api/create-payment-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || data.error) { setPaymentStatus("failed"); setPaymentError(data.error || "Erro ao iniciar pagamento."); return; }
      setPaymentIntentId(data.paymentIntentId);
      if (paymentMethod === "mbway") { setPaymentStatus("waiting_mbway"); startPolling(data.paymentIntentId); }
      else if (paymentMethod === "pix") { setPaymentStatus("waiting_pix"); setPixData({ qrCode: data.pixQrCode, code: data.pixCode }); startPolling(data.paymentIntentId); }
    } catch (e: any) { setPaymentStatus("failed"); setPaymentError(e.message || "Erro de conexão."); }
  };

  const handlePayment = () => { if (paymentMethod === "credit-card") handleInitCardPayment(); else handleOtherPayment(); };

  const handleRetry = () => { stopPolling(); setPaymentStatus("idle"); setPaymentError(""); setClientSecret(""); setPaymentIntentId(""); setPixData(null); setPollCount(0); setCardProcessing(false); };

  // --- Ecrã de sucesso ---
  if (paymentStatus === "succeeded") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-10 text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Pagamento Confirmado!</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">O seu acesso ao NutriLife Premium está ativo. A redirecionar...</p>
          <div className="flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Ecrã MB WAY ---
  if (paymentStatus === "waiting_mbway") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800 shadow-xl">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto">
            <Phone className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aguardando MB WAY</h2>
          <p className="text-gray-600 dark:text-gray-300">Notificação enviada para <strong>{mbwayPhone}</strong>.<br />Abra o MB WAY e aceite o pagamento de <strong>{currencySymbol} {finalPrice.toFixed(2)}</strong>.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" /><span>{Math.max(0, 180 - pollCount * 5)}s restantes</span>
          </div>
          <Button variant="outline" onClick={handleRetry} className="w-full"><RefreshCw className="w-4 h-4 mr-2" />Cancelar</Button>
        </Card>
      </div>
    );
  }

  // --- Ecrã PIX ---
  if (paymentStatus === "waiting_pix") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800 shadow-xl">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-teal-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pague via PIX</h2>
          {pixData?.qrCode && <img src={pixData.qrCode} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-xl border" />}
          {pixData?.code && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Código PIX:</p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xs break-all font-mono">{pixData.code}</div>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(pixData?.code || "")}>Copiar Código PIX</Button>
            </div>
          )}
          <Button variant="outline" onClick={handleRetry} className="w-full"><RefreshCw className="w-4 h-4 mr-2" />Cancelar</Button>
        </Card>
      </div>
    );
  }

  // --- Ecrã de erro ---
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-10 text-center space-y-6 dark:bg-gray-800 shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamento Falhado</h2>
          <p className="text-gray-600 dark:text-gray-300">{paymentError}</p>
          <Button onClick={handleRetry} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6">Tentar Novamente</Button>
        </Card>
      </div>
    );
  }

  // --- Formulário principal ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Checkout Seguro</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Coluna esquerda — Resumo do plano (2/5) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Título */}
            <div>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wide mb-1">NutriLife Premium</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transforme a sua alimentação</h1>
            </div>

            {/* Seletor de moeda */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Moeda</p>
              <div className="grid grid-cols-3 gap-2">
                {(["EUR", "BRL", "USD"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrency(c);
                      if (c === "EUR") setPaymentMethod("credit-card");
                      else if (c === "BRL") setPaymentMethod("pix");
                      else setPaymentMethod("credit-card");
                    }}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border-2 ${currency === c ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300"}`}
                  >
                    {prices[c].symbol} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de período */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Plano</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`relative py-4 px-4 rounded-xl border-2 transition-all text-left ${billingPeriod === "monthly" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}`}
                >
                  <p className="font-bold text-gray-900 dark:text-white">Mensal</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{currencySymbol} {currentPrice.monthly}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">por mês</p>
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`relative py-4 px-4 rounded-xl border-2 transition-all text-left ${billingPeriod === "annual" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}`}
                >
                  {billingPeriod === "annual" && (
                    <span className="absolute -top-2.5 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{savingsPercentage}%</span>
                  )}
                  <p className="font-bold text-gray-900 dark:text-white">Anual</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{currencySymbol} {currentPrice.annual}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currencySymbol} {(currentPrice.annual / 12).toFixed(2)}/mês</p>
                </button>
              </div>
            </div>

            {/* Resumo do valor */}
            <div className="bg-emerald-600 dark:bg-emerald-700 rounded-2xl p-6 text-white">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-emerald-200 text-sm">Total a pagar</p>
                  <p className="text-4xl font-bold mt-1">{currencySymbol} {finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-200 text-xs">/{billingPeriod === "annual" ? "ano" : "mês"}</p>
                  {billingPeriod === "annual" && <p className="text-emerald-200 text-xs mt-1">{currencySymbol} {monthlyEquivalent}/mês</p>}
                </div>
              </div>
              {billingPeriod === "annual" && (
                <div className="mt-3 pt-3 border-t border-emerald-500">
                  <p className="text-emerald-100 text-sm">Poupa {currencySymbol} {savingsAmount} por ano</p>
                </div>
              )}
            </div>

            {/* Features incluídas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Incluído no plano</p>
              {[
                "Plano alimentar personalizado por IA",
                "Contador automático de calorias e macros",
                "Receitas saudáveis exclusivas",
                "Acompanhamento diário de progresso",
                "Relatórios semanais detalhados",
                "Suporte profissional via chat",
                "Garantia de 30 dias",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{f}</span>
                </div>
              ))}
            </div>

            {/* Avaliações */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border dark:border-gray-700">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                <span className="text-sm font-bold text-gray-900 dark:text-white ml-1">4.9/5</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">"Perdi 8kg em 2 meses! O plano personalizado mudou tudo." — Ana M.</p>
            </div>
          </div>

          {/* Coluna direita — Formulário de pagamento (3/5) */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 overflow-hidden">

              {/* Cabeçalho do formulário */}
              <div className="bg-gray-50 dark:bg-gray-900 px-8 py-5 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Informações de Pagamento</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete o seu cadastro em segundos</p>
              </div>

              <div className="p-8 space-y-6">

                {/* Erro */}
                {paymentError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200 text-sm">Erro no Pagamento</p>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-0.5">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Método de pagamento */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Método de pagamento</p>
                  <div className="space-y-2">
                    {/* Cartão */}
                    <button
                      onClick={() => setPaymentMethod("credit-card")}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === "credit-card" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "credit-card" ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-700"}`}>
                        <CreditCard className={`w-5 h-5 ${paymentMethod === "credit-card" ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Cartão de Crédito / Débito</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Visa, Mastercard, American Express</p>
                      </div>
                      {paymentMethod === "credit-card" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>

                    {/* MB WAY — só EUR */}
                    {currency === "EUR" && (
                      <button
                        onClick={() => setPaymentMethod("mbway")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === "mbway" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "mbway" ? "bg-blue-500" : "bg-gray-100 dark:bg-gray-700"}`}>
                          <Phone className={`w-5 h-5 ${paymentMethod === "mbway" ? "text-white" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">MB WAY</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pagamento instantâneo via telemóvel</p>
                        </div>
                        {paymentMethod === "mbway" && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                      </button>
                    )}

                    {/* PIX — só BRL */}
                    {currency === "BRL" && (
                      <button
                        onClick={() => setPaymentMethod("pix")}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === "pix" ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20" : "border-gray-200 dark:border-gray-600 hover:border-gray-300"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "pix" ? "bg-teal-500" : "bg-gray-100 dark:bg-gray-700"}`}>
                          <Zap className={`w-5 h-5 ${paymentMethod === "pix" ? "text-white" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">PIX</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Pagamento instantâneo — 5% de desconto</p>
                        </div>
                        {paymentMethod === "pix" && <CheckCircle2 className="w-5 h-5 text-teal-500" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Formulário do cartão */}
                {paymentMethod === "credit-card" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome do Titular <span className="text-gray-400 font-normal">(opcional)</span>
                      </Label>
                      <Input
                        id="cardName"
                        placeholder="Nome como está no cartão"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="mt-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-xl"
                      />
                    </div>

                    {paymentStatus === "waiting_card" && clientSecret ? (
                      <StripeCardForm
                        clientSecret={clientSecret}
                        cardholderName={cardholderName}
                        finalPrice={finalPrice}
                        currencySymbol={currencySymbol}
                        processing={cardProcessing}
                        setProcessing={setCardProcessing}
                        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
                        onSuccess={() => { setPaymentStatus("succeeded"); saveAndComplete(); }}
                        onError={(msg) => { setPaymentStatus("failed"); setPaymentError(msg); }}
                      />
                    ) : (
                      <Button
                        onClick={handlePayment}
                        disabled={paymentStatus === "processing"}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 text-base font-semibold shadow-md"
                      >
                        {paymentStatus === "processing" ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            A preparar pagamento...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Prosseguir para Pagamento Seguro
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* MB WAY */}
                {paymentMethod === "mbway" && currency === "EUR" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mbwayPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de Telemóvel</Label>
                      <Input
                        id="mbwayPhone"
                        placeholder="+351 912 345 678"
                        value={mbwayPhone}
                        onChange={(e) => setMbwayPhone(e.target.value)}
                        className="mt-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-xl"
                      />
                      <p className="text-xs text-gray-500 mt-1">Inclua o indicativo (+351 para Portugal)</p>
                    </div>
                  </div>
                )}

                {/* PIX info */}
                {paymentMethod === "pix" && currency === "BRL" && (
                  <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-teal-600" />
                      <div>
                        <p className="font-semibold text-teal-900 dark:text-teal-100 text-sm">Pagamento via PIX com 5% de desconto</p>
                        <p className="text-teal-700 dark:text-teal-300 text-sm">Total: R$ {finalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumo de valor + botão final (mbway e pix) */}
                {paymentMethod !== "credit-card" && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Plano {billingPeriod === "annual" ? "Anual" : "Mensal"}</span>
                        <span>{currencySymbol} {price}</span>
                      </div>
                      {paymentMethod === "pix" && currency === "BRL" && (
                        <div className="flex justify-between text-sm text-teal-600 dark:text-teal-400">
                          <span>Desconto PIX (5%)</span>
                          <span>- R$ {(price * 0.05).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-600">
                        <span>Total</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{currencySymbol} {finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={paymentStatus === "processing"}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 text-base font-semibold shadow-md"
                    >
                      {paymentStatus === "processing" ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          A processar...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Finalizar Pagamento
                        </span>
                      )}
                    </Button>
                  </>
                )}

                {/* Selos de segurança */}
                <div className="border-t dark:border-gray-700 pt-5">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pagamento Seguro Certificado pela Stripe</span>
                  </div>

                  {/* Ícones cartões */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md tracking-wide">VISA</div>
                    <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md">MC</div>
                    <div className="bg-blue-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-md">AMEX</div>
                    <div className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-md">DISC</div>
                    <div className="bg-gray-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-md">+135</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Lock, text: "Encriptação SSL 256-bit" },
                      { icon: Shield, text: "Proteção 3D Secure" },
                      { icon: Award, text: "Garantia 30 dias" },
                      { icon: CheckCircle2, text: "Dados nunca armazenados" },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
                    Ao finalizar, concorda com os Termos de Uso e Política de Privacidade
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
