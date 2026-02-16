"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CheckCircle2, CreditCard, Shield, Sparkles, DollarSign, Euro, Phone, AlertCircle } from "lucide-react";

interface PaymentScreenProps {
  userData: any;
  onComplete: () => void;
  onBack: () => void;
}

export default function PaymentScreen({ userData, onComplete, onBack }: PaymentScreenProps) {
  const [currency, setCurrency] = useState<"BRL" | "USD" | "EUR">("BRL");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [mbwayPhone, setMbwayPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handlePayment = () => {
    // Validação de pagamento
    setPaymentError("");

    // Validar método de pagamento
    if (paymentMethod === "credit-card") {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        setPaymentError("Por favor, preencha todos os dados do cartão de crédito.");
        return;
      }
      if (cardData.number.replace(/\s/g, "").length < 13) {
        setPaymentError("Número do cartão inválido.");
        return;
      }
      if (cardData.cvv.length < 3) {
        setPaymentError("CVV inválido.");
        return;
      }
    }

    if (paymentMethod === "mbway" && currency === "EUR") {
      if (!mbwayPhone || mbwayPhone.length < 9) {
        setPaymentError("Por favor, insira um número de telemóvel válido.");
        return;
      }
    }

    // Simula processamento de pagamento
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      // Só avança se o pagamento for bem-sucedido
      onComplete();
    }, 2000);
  };

  // Preços base em cada moeda
  const prices = {
    BRL: { 
      monthly: 49.90,
      annual: 497, 
      symbol: "R$" 
    },
    USD: { 
      monthly: 9.90,
      annual: 97, 
      symbol: "$" 
    },
    EUR: { 
      monthly: 8.90,
      annual: 89, 
      symbol: "€" 
    },
  };

  const currentPrice = prices[currency];
  const price = billingPeriod === "annual" ? currentPrice.annual : currentPrice.monthly;
  const monthlyEquivalent = billingPeriod === "annual" ? (currentPrice.annual / 12).toFixed(2) : currentPrice.monthly.toFixed(2);
  const currencySymbol = currentPrice.symbol;
  const savingsAmount = billingPeriod === "annual" ? (currentPrice.monthly * 12 - currentPrice.annual).toFixed(2) : "0";
  const savingsPercentage = billingPeriod === "annual" ? Math.round(((currentPrice.monthly * 12 - currentPrice.annual) / (currentPrice.monthly * 12)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 transition-colors">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Questionário
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Plan Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Escolha Seu Plano Premium
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Acesso completo a todas as funcionalidades
              </p>
            </div>

            {/* Billing Period Selection */}
            <Card className="p-6 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
              <Label className="text-base font-semibold mb-3 block dark:text-white">
                Período de Cobrança:
              </Label>
              <RadioGroup
                value={billingPeriod}
                onValueChange={(value) => setBillingPeriod(value as "monthly" | "annual")}
                className="grid grid-cols-2 gap-4"
              >
                <div className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${billingPeriod === "monthly" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                  <Label htmlFor="monthly" className="cursor-pointer">
                    <div className="text-center space-y-2">
                      <div className="font-bold text-2xl dark:text-white">Mensal</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pague mensalmente</div>
                    </div>
                  </Label>
                </div>
                
                <div className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${billingPeriod === "annual" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="annual" id="annual" className="sr-only" />
                  <Label htmlFor="annual" className="cursor-pointer">
                    <div className="text-center space-y-2">
                      <div className="font-bold text-2xl dark:text-white">Anual</div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                        Economize {savingsPercentage}%
                      </div>
                    </div>
                  </Label>
                  {billingPeriod === "annual" && (
                    <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      MELHOR OFERTA
                    </div>
                  )}
                </div>
              </RadioGroup>
            </Card>

            {/* Currency Selection */}
            <Card className="p-6 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg">
              <Label className="text-base font-semibold mb-3 block dark:text-white">
                Escolha sua moeda:
              </Label>
              <RadioGroup
                value={currency}
                onValueChange={(value) => setCurrency(value as "BRL" | "USD" | "EUR")}
                className="grid grid-cols-3 gap-3"
              >
                <div className={`flex items-center justify-center border-2 rounded-lg p-4 cursor-pointer transition-all ${currency === "BRL" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="BRL" id="BRL" className="sr-only" />
                  <Label htmlFor="BRL" className="cursor-pointer text-center w-full">
                    <div className="font-bold text-lg dark:text-white">R$</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Real</div>
                  </Label>
                </div>
                <div className={`flex items-center justify-center border-2 rounded-lg p-4 cursor-pointer transition-all ${currency === "USD" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="USD" id="USD" className="sr-only" />
                  <Label htmlFor="USD" className="cursor-pointer text-center w-full">
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="w-5 h-5 dark:text-white" />
                      <span className="font-bold text-lg dark:text-white">USD</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Dólar</div>
                  </Label>
                </div>
                <div className={`flex items-center justify-center border-2 rounded-lg p-4 cursor-pointer transition-all ${currency === "EUR" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <RadioGroupItem value="EUR" id="EUR" className="sr-only" />
                  <Label htmlFor="EUR" className="cursor-pointer text-center w-full">
                    <div className="flex items-center justify-center gap-1">
                      <Euro className="w-5 h-5 dark:text-white" />
                      <span className="font-bold text-lg dark:text-white">EUR</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Euro</div>
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            {/* Price Card */}
            <Card className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 text-white">
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{currencySymbol} {price}</span>
                  <span className="text-xl opacity-90">/{billingPeriod === "annual" ? "ano" : "mês"}</span>
                </div>
                {billingPeriod === "annual" && (
                  <p className="text-emerald-100 text-lg">
                    Apenas {currencySymbol} {monthlyEquivalent}/mês
                  </p>
                )}
                {billingPeriod === "annual" && (
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm opacity-90">
                      💰 Economize {currencySymbol} {savingsAmount} comparado ao plano mensal
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                O que está incluído:
              </h3>
              <div className="space-y-3">
                {[
                  "Plano alimentar personalizado baseado no seu perfil",
                  "Contador automático de calorias e macros",
                  "Receitas saudáveis exclusivas",
                  "Acompanhamento diário de progresso",
                  "Relatórios semanais detalhados",
                  "Suporte profissional via chat",
                  "Acesso à comunidade exclusiva",
                  "Atualizações e novos recursos gratuitos",
                  "Garantia de 30 dias - satisfação total",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Pagamento Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Garantia 30 dias</span>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="space-y-6">
            <Card className="p-8 shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Informações de Pagamento
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Complete seu cadastro e comece hoje
                  </p>
                </div>

                {/* Error Message */}
                {paymentError && (
                  <Card className="p-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-900 dark:text-red-100">
                        <p className="font-semibold mb-1">Erro no Pagamento</p>
                        <p className="text-red-700 dark:text-red-300">{paymentError}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Payment Method */}
                <div>
                  <Label className="text-base font-semibold mb-3 block dark:text-white">
                    Método de Pagamento
                  </Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg p-4 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium dark:text-white">Cartão de Crédito</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00457C">
                          <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.68H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
                          <path d="M2.379 0h7.99c1.384 0 2.485.296 3.089 1.03.581.706.76 1.747.536 3.101-.675 4.08-3.82 6.207-8.32 6.207H3.447L2.379 0z" fill="#0079C1"/>
                        </svg>
                        <span className="font-medium dark:text-white">PayPal</span>
                      </Label>
                    </div>

                    {currency === "BRL" && (
                      <div className="flex items-center space-x-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          <span className="font-medium dark:text-white">PIX (5% desconto)</span>
                        </Label>
                      </div>
                    )}
                    {currency === "EUR" && (
                      <div className="flex items-center space-x-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <RadioGroupItem value="mbway" id="mbway" />
                        <Label htmlFor="mbway" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium dark:text-white">MB WAY</span>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {paymentMethod === "credit-card" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber" className="dark:text-white">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) =>
                          setCardData({ ...cardData, number: e.target.value })
                        }
                        maxLength={19}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardName" className="dark:text-white">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        placeholder="Nome como está no cartão"
                        value={cardData.name}
                        onChange={(e) =>
                          setCardData({ ...cardData, name: e.target.value })
                        }
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry" className="dark:text-white">Validade</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/AA"
                          value={cardData.expiry}
                          onChange={(e) =>
                            setCardData({ ...cardData, expiry: e.target.value })
                          }
                          maxLength={5}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv" className="dark:text-white">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) =>
                            setCardData({ ...cardData, cvv: e.target.value })
                          }
                          maxLength={4}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <Card className="p-6 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#00457C">
                          <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.68H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
                          <path d="M2.379 0h7.99c1.384 0 2.485.296 3.089 1.03.581.706.76 1.747.536 3.101-.675 4.08-3.82 6.207-8.32 6.207H3.447L2.379 0z" fill="#0079C1"/>
                        </svg>
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            Pagamento via PayPal
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Rápido, seguro e aceito mundialmente
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Após clicar em "Finalizar", você será redirecionado para o PayPal para completar o pagamento de forma segura.
                      </p>
                    </div>
                  </Card>
                )}

                {paymentMethod === "pix" && currency === "BRL" && (
                  <Card className="p-6 bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-200 dark:border-teal-700">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        <div>
                          <p className="font-semibold text-teal-900 dark:text-teal-100">
                            Pagamento via PIX
                          </p>
                          <p className="text-sm text-teal-700 dark:text-teal-300">
                            Ganhe 5% de desconto - R$ {(price * 0.95).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Após clicar em "Finalizar", você receberá o QR Code para pagamento instantâneo.
                      </p>
                    </div>
                  </Card>
                )}

                {paymentMethod === "mbway" && currency === "EUR" && (
                  <Card className="p-6 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            Pagamento via MB WAY
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Pagamento rápido e seguro pelo telemóvel
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="mbwayPhone" className="dark:text-white">Número de Telemóvel</Label>
                        <Input
                          id="mbwayPhone"
                          placeholder="+351 912 345 678"
                          value={mbwayPhone}
                          onChange={(e) => setMbwayPhone(e.target.value)}
                          className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Insira o número associado à sua conta MB WAY
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Após clicar em "Finalizar", receberá uma notificação no seu telemóvel para confirmar o pagamento.
                      </p>
                    </div>
                  </Card>
                )}

                {/* Summary */}
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
                    <span>
                      {currencySymbol}{" "}
                      {paymentMethod === "pix" && currency === "BRL"
                        ? (price * 0.95).toFixed(2)
                        : price}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg py-6"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando Pagamento...
                    </span>
                  ) : (
                    "Finalizar Pagamento"
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Ao finalizar, você concorda com nossos Termos de Uso e Política de Privacidade
                </p>
              </div>
            </Card>

            {/* Security Note */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Pagamento 100% Seguro</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Seus dados são criptografados e protegidos. Não armazenamos informações do cartão.
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
