"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
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
  EUR: { monthly: 8.90, annual: 89, symbol: "€" },
  BRL: { monthly: 49.90, annual: 497, symbol: "R$" },
  USD: { monthly: 9.90, annual: 97, symbol: "$" },
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
    ? (currentPrice.annual / 12).toFixed(2) : currentPrice.monthly.toFixed(2);
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
      } catch { }
    }, 5000);
  };

  const validate = (): string => {
    if (paymentMethod === "mbway") {
      const cleaned = mbwayPhone.replace(/[\s\-\(\)]/g, "");
      if (!cleaned || !/^\+?[0-9]{9,15}$/.test(cleaned))
        return "Insira um número válido (ex: +351912345678).";
    }
    return "";
  };

  const handleInitCardPayment = async () => {
    setPaymentError(""); setPaymentStatus("processing");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalPrice, currency, paymentMethod: "credit-card", billingPeriod }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setPaymentStatus("failed"); setPaymentError(`Erro: ${data.error || "Erro desconhecido"}`); return; }
      setClientSecret(data.clientSecret); setPaymentIntentId(data.paymentIntentId); setPaymentStatus("waiting_card");
    } catch (e: any) { setPaymentStatus("failed"); setPaymentError(`Erro de conexão: ${e.message}`); }
  };

  const handleOtherPayment = async () => {
    setPaymentError("");
    const err = validate(); if (err) { setPaymentError(err); return; }
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

  // Ecrã de sucesso
  if (paymentStatus === "succeeded") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm text-center space-y-5 py-12">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamento Confirmado!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">O seu acesso Premium está ativo. A redirecionar...</p>
          </div>
          <div className="flex justify-center gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        </div>
      </div>
    );
  }

  // Ecrã MB WAY
  if (paymentStatus === "waiting_mbway") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <Phone className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">A aguardar MB WAY</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Notificação enviada para <strong className="text-gray-700 dark:text-gray-200">{mbwayPhone}</strong></p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Aceite o pagamento de <strong className="text-emerald-600">{currencySymbol} {finalPrice.toFixed(2)}</strong> no MB WAY</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl py-3 px-4">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.max(0, 180 - pollCount * 5)} segundos restantes</span>
          </div>
          <Button variant="outline" onClick={handleRetry} className="w-full rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Ecrã PIX
  if (paymentStatus === "waiting_pix") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-teal-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pague via PIX</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Escaneie o QR Code ou copie o código</p>
          </div>
          {pixData?.qrCode && <img src={pixData.qrCode} alt="QR Code PIX" className="mx-auto w-44 h-44 rounded-xl border" />}
          {pixData?.code && (
            <div className="space-y-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs break-all font-mono text-gray-700 dark:text-gray-300">{pixData.code}</div>
              <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => navigator.clipboard.writeText(pixData?.code || "")}>Copiar Código PIX</Button>
            </div>
          )}
          <Button variant="outline" onClick={handleRetry} className="w-full rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Ecrã de erro
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pagamento Falhado</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{paymentError}</p>
          </div>
          <Button onClick={handleRetry} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 font-semibold">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // --- Formulário principal ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Barra do topo */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />Voltar
          </button>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Checkout Seguro</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Conteúdo — max-w-2xl centrado, uma coluna no mobile, duas no desktop */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Título */}
        <div className="text-center pb-2">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">NutriLife Premium</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete o seu pedido</h1>
        </div>

        {/* Moeda */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Moeda</p>
          <div className="grid grid-cols-3 gap-2">
            {(["EUR", "BRL", "USD"] as Currency[]).map((c) => (
              <button key={c} onClick={() => { setCurrency(c); setPaymentMethod(c === "BRL" ? "pix" : "credit-card"); }}
                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${currency === c ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {prices[c].symbol} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Plano */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Plano</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setBillingPeriod("monthly")}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${billingPeriod === "monthly" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-100 dark:border-gray-700"}`}>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Mensal</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{currencySymbol} {currentPrice.monthly}</p>
              <p className="text-xs text-gray-400 mt-0.5">por mês</p>
            </button>
            <button onClick={() => setBillingPeriod("annual")}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${billingPeriod === "annual" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-100 dark:border-gray-700"}`}>
              {savingsPercentage > 0 && (
                <span className="absolute -top-2.5 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{savingsPercentage}%</span>
              )}
              <p className="font-bold text-sm text-gray-900 dark:text-white">Anual</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{currencySymbol} {currentPrice.annual}</p>
              <p className="text-xs text-gray-400 mt-0.5">{currencySymbol} {(currentPrice.annual / 12).toFixed(2)}/mês</p>
            </button>
          </div>
        </div>

        {/* Método de pagamento */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Método de pagamento</p>
          <div className="space-y-2">
            {/* Cartão */}
            <button onClick={() => setPaymentMethod("credit-card")}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${paymentMethod === "credit-card" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-100 dark:border-gray-700"}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === "credit-card" ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-700"}`}>
                <CreditCard className={`w-4 h-4 ${paymentMethod === "credit-card" ? "text-white" : "text-gray-400"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Cartão de Crédito / Débito</p>
                <p className="text-xs text-gray-400">Visa · Mastercard · Amex</p>
              </div>
              {paymentMethod === "credit-card" && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </button>

            {/* MB WAY */}
            {currency === "EUR" && (
              <button onClick={() => setPaymentMethod("mbway")}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${paymentMethod === "mbway" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-100 dark:border-gray-700"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === "mbway" ? "bg-blue-500" : "bg-gray-100 dark:bg-gray-700"}`}>
                  <Phone className={`w-4 h-4 ${paymentMethod === "mbway" ? "text-white" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">MB WAY</p>
                  <p className="text-xs text-gray-400">Pagamento instantâneo · Portugal</p>
                </div>
                {paymentMethod === "mbway" && <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />}
              </button>
            )}

            {/* PIX */}
            {currency === "BRL" && (
              <button onClick={() => setPaymentMethod("pix")}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${paymentMethod === "pix" ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20" : "border-gray-100 dark:border-gray-700"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === "pix" ? "bg-teal-500" : "bg-gray-100 dark:bg-gray-700"}`}>
                  <Zap className={`w-4 h-4 ${paymentMethod === "pix" ? "text-white" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">PIX</p>
                  <p className="text-xs text-gray-400">Instantâneo · 5% de desconto</p>
                </div>
                {paymentMethod === "pix" && <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />}
              </button>
            )}
          </div>
        </div>

        {/* Campos do método selecionado */}
        {paymentMethod === "credit-card" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Dados do cartão</p>
            <div>
              <Label htmlFor="cardName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do titular <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </Label>
              <Input id="cardName" placeholder="Nome como está no cartão" value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                className="mt-1.5 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            {paymentStatus === "waiting_card" && clientSecret ? (
              <StripeCardForm
                clientSecret={clientSecret} cardholderName={cardholderName}
                finalPrice={finalPrice} currencySymbol={currencySymbol}
                processing={cardProcessing} setProcessing={setCardProcessing}
                publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
                onSuccess={() => { setPaymentStatus("succeeded"); saveAndComplete(); }}
                onError={(msg) => { setPaymentStatus("failed"); setPaymentError(msg); }}
              />
            ) : null}
          </div>
        )}

        {paymentMethod === "mbway" && currency === "EUR" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Número de telemóvel</p>
            <Input id="mbwayPhone" placeholder="+351 912 345 678" value={mbwayPhone}
              onChange={(e) => setMbwayPhone(e.target.value)}
              className="rounded-xl text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <p className="text-xs text-gray-400">Inclua o indicativo do país (+351 para Portugal)</p>
          </div>
        )}

        {paymentMethod === "pix" && currency === "BRL" && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-2xl p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-teal-800 dark:text-teal-200 text-sm">PIX com 5% de desconto</p>
              <p className="text-teal-600 dark:text-teal-400 text-xs mt-0.5">Total: R$ {finalPrice.toFixed(2)} — QR Code gerado após confirmar</p>
            </div>
          </div>
        )}

        {/* Erro */}
        {paymentError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200 text-sm">Erro no Pagamento</p>
              <p className="text-red-600 dark:text-red-300 text-xs mt-0.5">{paymentError}</p>
            </div>
          </div>
        )}

        {/* Resumo + botão */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Resumo</p>
          <div className="space-y-2">
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
            {billingPeriod === "annual" && (
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>Poupar vs mensal</span>
                <span>- {currencySymbol} {savingsAmount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
              <span>Total</span>
              <span className="text-emerald-600 dark:text-emerald-400">{currencySymbol} {finalPrice % 1 === 0 ? finalPrice : finalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Botão principal */}
          {paymentStatus !== "waiting_card" && (
            <Button
              onClick={handlePayment}
              disabled={paymentStatus === "processing"}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl py-6 text-base font-bold shadow-md"
            >
              {paymentStatus === "processing" ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A preparar...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {paymentMethod === "credit-card" ? "Prosseguir para Pagamento" : "Finalizar Pagamento"}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Selos de segurança */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Pagamento Certificado pela Stripe</span>
          </div>

          {/* Bandeiras */}
          <div className="flex items-center justify-center gap-2">
            <div className="bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md">VISA</div>
            <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md">MC</div>
            <div className="bg-blue-900 text-white text-xs font-bold px-2.5 py-1.5 rounded-md">AMEX</div>
            <div className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-md">DISC</div>
          </div>

          {/* Garantias em grade 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Lock, text: "SSL 256-bit" },
              { icon: Shield, text: "3D Secure" },
              { icon: Award, text: "Garantia 30 dias" },
              { icon: CheckCircle2, text: "Dados encriptados" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
                <Icon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Avaliação */}
          <div className="border-t dark:border-gray-700 pt-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">4.9/5</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">"Perdi 8kg em 2 meses!" — Ana M.</p>
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            Ao finalizar, concorda com os Termos de Uso e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
