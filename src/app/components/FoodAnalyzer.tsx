"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Activity,
  Droplet,
} from "lucide-react";

interface FoodAnalyzerProps {
  userGoals?: string;
  onAnalysisComplete?: (data: any) => void;
}

interface AnalysisResult {
  fullText: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  timestamp: string;
}

export default function FoodAnalyzer({ userGoals, onAnalysisComplete }: FoodAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Valida tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida');
        return;
      }

      // Valida tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          userGoals: userGoals,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar imagem');
      }

      setAnalysisResult(data.analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getHealthScore = (calories: number): { score: number; label: string; color: string } => {
    if (calories < 300) return { score: 90, label: "Excelente", color: "text-emerald-600" };
    if (calories < 500) return { score: 75, label: "Bom", color: "text-green-600" };
    if (calories < 700) return { score: 60, label: "Moderado", color: "text-yellow-600" };
    return { score: 40, label: "Alto", color: "text-orange-600" };
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!selectedImage && (
        <Card className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer dark:bg-gray-800">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="food-image-upload"
          />
          <label
            htmlFor="food-image-upload"
            className="flex flex-col items-center justify-center cursor-pointer space-y-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Tire uma foto da sua refeição
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Nossa IA analisará os alimentos e fornecerá informações nutricionais detalhadas
              </p>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Imagem
              </Button>
            </div>
          </label>
        </Card>
      )}

      {/* Image Preview & Analysis */}
      {selectedImage && (
        <div className="space-y-6">
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Análise da Refeição
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAnalyzer}
                className="text-gray-600 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Image */}
            <div className="relative rounded-xl overflow-hidden mb-4">
              <img
                src={selectedImage}
                alt="Refeição"
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Analyze Button */}
            {!analysisResult && !isAnalyzing && (
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-6 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analisar com IA
              </Button>
            )}

            {/* Loading */}
            {isAnalyzing && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Analisando sua refeição...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Nossa IA está identificando os alimentos e calculando os nutrientes
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Erro na análise</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Nutrition Summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Flame className="w-8 h-8" />
                    <span className="text-3xl font-bold">{analysisResult.calories}</span>
                  </div>
                  <p className="text-orange-100">Calorias Totais</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-8 h-8" />
                    <span className="text-3xl font-bold">{analysisResult.macros.protein}g</span>
                  </div>
                  <p className="text-blue-100">Proteínas</p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <Droplet className="w-8 h-8" />
                    <span className="text-3xl font-bold">{analysisResult.macros.carbs}g</span>
                  </div>
                  <p className="text-emerald-100">Carboidratos</p>
                </Card>
              </div>

              {/* Health Score */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 dark:text-white">Avaliação Nutricional</h4>
                  <span className={`text-2xl font-bold ${getHealthScore(analysisResult.calories).color}`}>
                    {getHealthScore(analysisResult.calories).label}
                  </span>
                </div>
                <Progress value={getHealthScore(analysisResult.calories).score} className="mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Score: {getHealthScore(analysisResult.calories).score}/100
                </p>
              </Card>

              {/* Detailed Analysis */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Análise Detalhada
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {analysisResult.fullText}
                  </p>
                </div>
              </Card>

              {/* Macros Breakdown */}
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                  Distribuição de Macronutrientes
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Proteínas</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analysisResult.macros.protein}g
                      </span>
                    </div>
                    <Progress
                      value={(analysisResult.macros.protein / 150) * 100}
                      className="bg-blue-100 dark:bg-blue-900/30"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Carboidratos</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analysisResult.macros.carbs}g
                      </span>
                    </div>
                    <Progress
                      value={(analysisResult.macros.carbs / 200) * 100}
                      className="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Gorduras</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {analysisResult.macros.fats}g
                      </span>
                    </div>
                    <Progress
                      value={(analysisResult.macros.fats / 70) * 100}
                      className="bg-yellow-100 dark:bg-yellow-900/30"
                    />
                  </div>
                </div>
              </Card>

              {/* New Analysis Button */}
              <Button
                onClick={resetAnalyzer}
                variant="outline"
                className="w-full border-2 dark:border-gray-600"
              >
                <Camera className="w-4 h-4 mr-2" />
                Analisar Nova Refeição
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
