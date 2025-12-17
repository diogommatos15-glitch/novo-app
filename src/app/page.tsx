"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Camera, CheckCircle2, Sparkles, TrendingDown, Apple, Activity, X, LogIn, Mail, Phone, Globe } from "lucide-react";
import QuestionnaireFlow from "./components/QuestionnaireFlow";
import PaymentScreen from "./components/PaymentScreen";
import Dashboard from "./components/Dashboard";
import ThemeToggle from "@/components/custom/ThemeToggle";
import LanguageSelector from "@/components/custom/LanguageSelector";

type AppState = "login" | "welcome" | "questionnaire" | "payment" | "dashboard";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("login");
  const [userData, setUserData] = useState<any>(null);
  const [loginData, setLoginData] = useState({ emailOrPhone: "" });

  const handleQuestionnaireComplete = (data: any) => {
    setUserData(data);
    setAppState("payment");
  };

  const handlePaymentComplete = () => {
    setAppState("dashboard");
  };

  // Validação flexível para email ou telefone internacional
  const isValidContact = (contact: string): boolean => {
    const trimmed = contact.trim();
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmed)) return true;
    
    // Validação de telefone internacional (aceita vários formatos)
    // Remove espaços, parênteses, hífens para validação
    const phoneDigits = trimmed.replace(/[\s\-\(\)]/g, '');
    
    // Aceita números com ou sem código de país (+)
    // Mínimo 8 dígitos, máximo 15 (padrão internacional)
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(phoneDigits);
  };

  const handleLogin = () => {
    const contact = loginData.emailOrPhone.trim();
    if (contact && isValidContact(contact)) {
      // Salva os dados de login
      setUserData({ ...userData, contact: contact });
      setAppState("welcome");
    }
  };

  // Detecta o tipo de entrada
  const getContactType = (value: string): "email" | "phone" | "unknown" => {
    if (!value) return "unknown";
    if (value.includes('@')) return "email";
    const hasDigits = /\d/.test(value);
    if (hasDigits) return "phone";
    return "unknown";
  };

  const contactType = getContactType(loginData.emailOrPhone);
  const isValid = loginData.emailOrPhone.trim() && isValidContact(loginData.emailOrPhone);

  // Tela de Login Inicial
  if (appState === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>

        <Card className="max-w-md w-full p-8 space-y-6 shadow-2xl dark:bg-gray-800">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto">
              <Apple className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Bem-vindo à NutriLife
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Aqui você vai encontrar tudo o que precisa para transformar seu corpo e sua saúde!
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone" className="text-base font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                Email ou Número de Telefone (Internacional)
              </Label>
              <div className="relative">
                <Input
                  id="emailOrPhone"
                  type="text"
                  placeholder="exemplo@email.com ou +351 912 345 678"
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({ emailOrPhone: e.target.value })}
                  className={`pl-10 py-6 text-base dark:bg-gray-700 dark:border-gray-600 transition-all ${
                    loginData.emailOrPhone && !isValid 
                      ? 'border-red-400 dark:border-red-500' 
                      : loginData.emailOrPhone && isValid 
                      ? 'border-emerald-400 dark:border-emerald-500' 
                      : ''
                  }`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {contactType === "email" ? (
                    <Mail className="w-5 h-5" />
                  ) : contactType === "phone" ? (
                    <Phone className="w-5 h-5" />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              {/* Dicas de formato */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-1">
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Email: exemplo@dominio.com
                </p>
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Telefone: +351 912 345 678, +55 11 98765-4321, +1 555 123 4567
                </p>
              </div>

              {loginData.emailOrPhone && !isValid && (
                <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  Por favor, insira um email ou telefone válido
                </p>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleLogin}
              disabled={!isValid}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Fazer Login na Sua Conta
            </Button>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Seus dados ficarão guardados com segurança
              </p>
            </div>
          </div>

          <div className="pt-6 border-t dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">50k+</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Usuários</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">-12kg</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Média</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">4.9★</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avaliação</div>
              </div>
            </div>
          </div>

          {/* Exemplos de formatos aceitos */}
          <div className="pt-4 border-t dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
              Aceito em todo o mundo 🌍
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">🇵🇹 Portugal</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">🇧🇷 Brasil</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">🇺🇸 EUA</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">🇬🇧 UK</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">🇪🇸 Espanha</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">+150 países</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (appState === "questionnaire") {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <QuestionnaireFlow
          onComplete={handleQuestionnaireComplete}
          onBack={() => setAppState("welcome")}
        />
      </>
    );
  }

  if (appState === "payment") {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <PaymentScreen
          userData={userData}
          onComplete={handlePaymentComplete}
          onBack={() => setAppState("questionnaire")}
        />
      </>
    );
  }

  if (appState === "dashboard") {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <Dashboard userData={userData} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header com Idiomas */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              NutriLife
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Tecnologia de IA Avançada
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
            Transforme Seu Corpo
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Com Inteligência Artificial
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Plano personalizado de emagrecimento com análise de fotos, nutrição inteligente e acompanhamento profissional
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => setAppState("questionnaire")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Iniciar Avaliação Gratuita
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl border-2 dark:border-gray-600 dark:text-gray-200"
            >
              Ver Como Funciona
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">50k+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Usuários Ativos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">-12kg</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Média de Perda</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">4.9★</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Como Funciona
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Tecnologia de ponta para resultados reais
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 hover:shadow-2xl transition-all border-2 hover:border-emerald-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-emerald-500">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              1. Avaliação Completa
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Questionário detalhado sobre seu estilo de vida, objetivos, histórico de saúde e preferências alimentares
            </p>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all border-2 hover:border-emerald-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-emerald-500">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              2. Plano Personalizado
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Acesso anual completo ao seu plano de emagrecimento personalizado com metas e acompanhamento
            </p>
          </Card>

          <Card className="p-8 hover:shadow-2xl transition-all border-2 hover:border-emerald-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-emerald-500">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              3. Análise com IA
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Tire fotos das suas refeições e receba análise nutricional instantânea com calorias, macros e sugestões
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Tudo Que Você Precisa Para Emagrecer
            </h2>
            <div className="grid md:grid-cols-2 gap-6 pt-8">
              {[
                "Plano alimentar personalizado",
                "Análise de fotos com IA",
                "Contador de calorias automático",
                "Receitas saudáveis exclusivas",
                "Acompanhamento de progresso",
                "Suporte profissional 24/7",
                "Relatórios semanais detalhados",
                "Comunidade motivadora",
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Comece Sua Transformação Hoje
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Milhares de pessoas já alcançaram seus objetivos. Você é o próximo!
          </p>
          <Button
            size="lg"
            onClick={() => setAppState("questionnaire")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-12 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            Começar Avaliação Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 dark:border-gray-800 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 NutriLife. Todos os direitos reservados.</p>
          <p className="text-sm mt-2">
            Consulte sempre um profissional de saúde antes de iniciar qualquer programa de emagrecimento.
          </p>
        </div>
      </footer>
    </div>
  );
}
