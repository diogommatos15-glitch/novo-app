"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  TrendingDown,
  Apple,
  Flame,
  Droplet,
  Activity,
  Target,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Timer,
  Footprints,
  Bike,
  Waves,
  Mountain,
  Zap,
  Heart,
  Mail,
  Camera,
} from "lucide-react";
import FoodAnalyzer from "./FoodAnalyzer";

interface DashboardProps {
  userData: any;
}

export default function Dashboard({ userData }: DashboardProps) {
  // Estados do Modo Ginásio
  const [gymMode, setGymMode] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseIntensity, setExerciseIntensity] = useState<"low" | "medium" | "high">("medium");

  // Timer do treino
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1);
        // Calcula calorias baseado no exercício e intensidade
        if (selectedExercise) {
          const exercise = exercises.find((e) => e.name === selectedExercise);
          if (exercise) {
            const intensityMultiplier = 
              exerciseIntensity === "low" ? 0.7 : 
              exerciseIntensity === "high" ? 1.3 : 1;
            const caloriesPerSecond = (exercise.caloriesPerMinute * intensityMultiplier) / 60;
            setCaloriesBurned((prev) => prev + caloriesPerSecond);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, selectedExercise, exerciseIntensity]);

  // Exercícios disponíveis
  const exercises = [
    { 
      name: "Corrida", 
      icon: Footprints, 
      caloriesPerMinute: 10, 
      description: "Cardio intenso para queimar calorias",
      tips: [
        "Mantenha postura ereta",
        "Respire pelo nariz e boca",
        "Aqueça antes de começar",
        "Hidrate-se regularmente"
      ]
    },
    { 
      name: "Ciclismo", 
      icon: Bike, 
      caloriesPerMinute: 8, 
      description: "Baixo impacto, ótimo para resistência",
      tips: [
        "Ajuste o selim na altura correta",
        "Mantenha as costas retas",
        "Varie a resistência",
        "Use tênis adequado"
      ]
    },
    { 
      name: "Natação", 
      icon: Waves, 
      caloriesPerMinute: 11, 
      description: "Trabalha corpo inteiro",
      tips: [
        "Respire de forma ritmada",
        "Mantenha o corpo alinhado",
        "Varie os estilos de nado",
        "Aqueça fora da água primeiro"
      ]
    },
    { 
      name: "Musculação", 
      icon: Dumbbell, 
      caloriesPerMinute: 6, 
      description: "Fortalecimento e definição",
      tips: [
        "Execute movimentos completos",
        "Controle a respiração",
        "Descanse entre séries",
        "Aumente peso progressivamente"
      ]
    },
    { 
      name: "HIIT", 
      icon: Zap, 
      caloriesPerMinute: 12, 
      description: "Alta intensidade, máxima queima",
      tips: [
        "Dê 100% nos intervalos ativos",
        "Recupere completamente nos descansos",
        "Limite a 20-30 minutos",
        "Faça 2-3x por semana"
      ]
    },
    { 
      name: "Caminhada", 
      icon: Mountain, 
      caloriesPerMinute: 4, 
      description: "Baixo impacto, ideal para iniciantes",
      tips: [
        "Mantenha ritmo constante",
        "Balance os braços naturalmente",
        "Use calçado confortável",
        "Aumente distância gradualmente"
      ]
    },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startWorkout = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setIsWorkoutActive(true);
    setGymMode(true);
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
  };

  const resumeWorkout = () => {
    setIsWorkoutActive(true);
  };

  const stopWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutTime(0);
    setCaloriesBurned(0);
    setSelectedExercise(null);
  };

  const currentWeight = Number(userData?.weight) || 80;
  const targetWeight = Number(userData?.targetWeight) || 70;
  const weightLost = 3.5;
  const progressPercentage = (weightLost / (currentWeight - targetWeight)) * 100;

  const dailyGoals = {
    calories: 1800,
    caloriesConsumed: 1240,
    protein: 120,
    proteinConsumed: 85,
    water: 2.5,
    waterConsumed: 1.8,
  };

  const displayContact = userData?.contact;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  NutriLife
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">Olá, {userData?.name?.split(" ")[0]}!</p>
              </div>
            </div>

            {displayContact && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {displayContact}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-100 text-sm">Peso Atual</p>
                <p className="text-4xl font-bold">{(currentWeight - weightLost).toFixed(1)}kg</p>
              </div>
              <TrendingDown className="w-12 h-12 opacity-80" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meta: {targetWeight}kg</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="bg-white/20" />
              <p className="text-xs text-emerald-100">
                Faltam {(currentWeight - weightLost - targetWeight).toFixed(1)}kg para sua meta
              </p>
            </div>
          </Card>

          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Dias Ativos</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">23</p>
              </div>
              <Calendar className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔥 Sequência de 7 dias!
            </p>
          </Card>

          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Treinos Completos</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">42</p>
              </div>
              <Dumbbell className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ✨ Média de 6 por semana
            </p>
          </Card>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="analyzer">
              <Camera className="w-4 h-4 mr-2" />
              Analisar Foto
            </TabsTrigger>
            <TabsTrigger value="gym">
              <Dumbbell className="w-4 h-4 mr-2" />
              Ginásio
            </TabsTrigger>
            <TabsTrigger value="plan">Meu Plano</TabsTrigger>
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Calories */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Calorias</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dailyGoals.caloriesConsumed}
                    </p>
                  </div>
                </div>
                <Progress
                  value={(dailyGoals.caloriesConsumed / dailyGoals.calories) * 100}
                  className="mb-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Meta: {dailyGoals.calories} kcal
                </p>
              </Card>

              {/* Protein */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Proteína</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dailyGoals.proteinConsumed}g
                    </p>
                  </div>
                </div>
                <Progress
                  value={(dailyGoals.proteinConsumed / dailyGoals.protein) * 100}
                  className="mb-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Meta: {dailyGoals.protein}g
                </p>
              </Card>

              {/* Water */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Água</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dailyGoals.waterConsumed}L
                    </p>
                  </div>
                </div>
                <Progress
                  value={(dailyGoals.waterConsumed / dailyGoals.water) * 100}
                  className="mb-2"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Meta: {dailyGoals.water}L
                </p>
              </Card>
            </div>

            {/* Recent Meals */}
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Refeições de Hoje
              </h3>
              <div className="space-y-4">
                {[
                  { time: "08:00", name: "Café da Manhã", calories: 380, icon: "☕" },
                  { time: "12:30", name: "Almoço", calories: 520, icon: "🍽️" },
                  { time: "16:00", name: "Lanche", calories: 180, icon: "🍎" },
                  { time: "19:30", name: "Jantar", calories: 160, icon: "🥗" },
                ].map((meal, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{meal.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{meal.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{meal.calories} kcal</p>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Food Analyzer Tab */}
          <TabsContent value="analyzer" className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white mb-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Camera className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold">Análise de Refeições com IA</h2>
                <p className="text-lg text-purple-100">
                  Tire uma foto da sua comida e receba análise nutricional completa instantaneamente
                </p>
              </div>
            </Card>

            <FoodAnalyzer 
              userGoals={`Perder ${currentWeight - targetWeight}kg em ${userData?.timeline}`}
              onAnalysisComplete={(data) => {
                console.log('Análise completa:', data);
              }}
            />
          </TabsContent>

          {/* Gym Tab */}
          <TabsContent value="gym" className="space-y-6">
            {!gymMode ? (
              <div className="space-y-6">
                <Card className="p-8 bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                      <Dumbbell className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold">Modo Ginásio</h2>
                    <p className="text-lg text-orange-100">
                      Conte calorias em tempo real e receba dicas personalizadas de exercícios
                    </p>
                  </div>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exercises.map((exercise) => {
                    const Icon = exercise.icon;
                    return (
                      <Card
                        key={exercise.name}
                        className="p-6 dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => startWorkout(exercise.name)}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {exercise.caloriesPerMinute}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">kcal/min</p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                              {exercise.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {exercise.description}
                            </p>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar Treino
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Treino Ativo */}
                <Card className="p-8 bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {exercises.find((e) => e.name === selectedExercise)?.icon && (
                          React.createElement(
                            exercises.find((e) => e.name === selectedExercise)!.icon,
                            { className: "w-10 h-10" }
                          )
                        )}
                        <div>
                          <h3 className="text-2xl font-bold">{selectedExercise}</h3>
                          <p className="text-orange-100">Treino em andamento</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isWorkoutActive ? (
                          <Button
                            onClick={pauseWorkout}
                            variant="secondary"
                            size="lg"
                            className="bg-white/20 hover:bg-white/30"
                          >
                            <Pause className="w-5 h-5" />
                          </Button>
                        ) : (
                          <Button
                            onClick={resumeWorkout}
                            variant="secondary"
                            size="lg"
                            className="bg-white/20 hover:bg-white/30"
                          >
                            <Play className="w-5 h-5" />
                          </Button>
                        )}
                        <Button
                          onClick={stopWorkout}
                          variant="secondary"
                          size="lg"
                          className="bg-white/20 hover:bg-white/30"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-6xl font-bold mb-2">{formatTime(workoutTime)}</div>
                        <p className="text-orange-100 flex items-center justify-center gap-2">
                          <Timer className="w-4 h-4" />
                          Tempo de Treino
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-6xl font-bold mb-2">{Math.round(caloriesBurned)}</div>
                        <p className="text-orange-100 flex items-center justify-center gap-2">
                          <Flame className="w-4 h-4" />
                          Calorias Queimadas
                        </p>
                      </div>
                    </div>

                    {/* Intensidade */}
                    <div className="space-y-3">
                      <Label className="text-white text-lg">Intensidade do Treino</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {(["low", "medium", "high"] as const).map((intensity) => (
                          <Button
                            key={intensity}
                            onClick={() => setExerciseIntensity(intensity)}
                            variant={exerciseIntensity === intensity ? "secondary" : "outline"}
                            className={
                              exerciseIntensity === intensity
                                ? "bg-white text-orange-600"
                                : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                            }
                          >
                            {intensity === "low" ? "Leve" : intensity === "medium" ? "Moderada" : "Intensa"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dicas do Exercício */}
                <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    Dicas para Melhor Performance
                  </h3>
                  <div className="space-y-3">
                    {exercises
                      .find((e) => e.name === selectedExercise)
                      ?.tips.map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                        >
                          <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* Estatísticas do Treino */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {exercises.find((e) => e.name === selectedExercise)?.caloriesPerMinute}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">kcal/min</p>
                    </div>
                  </Card>

                  <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {exerciseIntensity === "low" ? "120" : exerciseIntensity === "high" ? "160" : "140"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">BPM médio</p>
                    </div>
                  </Card>

                  <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {Math.round((caloriesBurned / dailyGoals.calories) * 100)}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">da meta diária</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="space-y-6">
            <Card className="p-8 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Seu Plano Personalizado
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700">
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-3">
                      📊 Seu Perfil
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p><strong>Objetivo:</strong> Perder {currentWeight - targetWeight}kg</p>
                      <p><strong>Prazo:</strong> {userData?.timeline}</p>
                      <p><strong>Atividade:</strong> {userData?.activityLevel}</p>
                      <p><strong>Restrições:</strong> {userData?.restrictions?.join(", ") || "Nenhuma"}</p>
                    </div>
                  </Card>

                  <Card className="p-6 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
                      🎯 Metas Diárias
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p><strong>Calorias:</strong> {dailyGoals.calories} kcal</p>
                      <p><strong>Proteína:</strong> {dailyGoals.protein}g</p>
                      <p><strong>Água:</strong> {dailyGoals.water}L</p>
                      <p><strong>Refeições:</strong> {userData?.mealsPerDay} por dia</p>
                    </div>
                  </Card>
                </div>

                <Card className="p-6 dark:bg-gray-700 dark:border-gray-600">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    📅 Plano Semanal de Refeições
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Segunda: Frango grelhado + Arroz integral + Brócolis",
                      "Terça: Peixe assado + Batata doce + Salada verde",
                      "Quarta: Omelete de claras + Aveia + Frutas",
                      "Quinta: Carne magra + Quinoa + Legumes",
                      "Sexta: Salmão + Arroz integral + Aspargos",
                      "Sábado: Frango + Macarrão integral + Tomate",
                      "Domingo: Livre (com moderação)",
                    ].map((meal, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-gray-700 dark:text-gray-200">{meal}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-900 text-white">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Dica do Dia
                  </h3>
                  <p className="text-emerald-100 dark:text-emerald-200">
                    Beba um copo de água antes de cada refeição. Isso ajuda na digestão e aumenta a sensação de saciedade!
                  </p>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
