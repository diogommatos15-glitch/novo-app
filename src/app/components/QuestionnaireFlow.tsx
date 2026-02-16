"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface QuestionnaireFlowProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function QuestionnaireFlow({ onComplete, onBack }: QuestionnaireFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Dados Pessoais
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    targetWeight: "",
    
    // Estilo de Vida
    activityLevel: "",
    occupation: "",
    sleepHours: "",
    stressLevel: "",
    
    // Saúde
    healthConditions: [] as string[],
    medications: "",
    allergies: "",
    previousDiets: "",
    
    // Alimentação
    mealsPerDay: "",
    waterIntake: "",
    foodPreferences: [] as string[],
    restrictions: [] as string[],
    
    // Objetivos
    mainGoal: "",
    timeline: "",
    motivation: "",
    challenges: "",
  });

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter((v: string) => v !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dados Pessoais</h2>
              <p className="text-gray-600 dark:text-gray-300">Vamos começar conhecendo você melhor</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="dark:text-white">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="dark:text-white">Idade *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="Ex: 30"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="dark:text-white">Gênero *</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => updateField("gender", value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="masculino" id="masculino" />
                      <Label htmlFor="masculino" className="dark:text-white">Masculino</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feminino" id="feminino" />
                      <Label htmlFor="feminino" className="dark:text-white">Feminino</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="height" className="dark:text-white">Altura (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder="Ex: 170"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="weight" className="dark:text-white">Peso Atual (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="Ex: 80"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="targetWeight" className="dark:text-white">Peso Desejado (kg) *</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    value={formData.targetWeight}
                    onChange={(e) => updateField("targetWeight", e.target.value)}
                    placeholder="Ex: 70"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Estilo de Vida</h2>
              <p className="text-gray-600 dark:text-gray-300">Entenda sua rotina diária</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="dark:text-white">Nível de Atividade Física *</Label>
                <RadioGroup
                  value={formData.activityLevel}
                  onValueChange={(value) => updateField("activityLevel", value)}
                  className="space-y-3 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sedentario" id="sedentario" />
                    <Label htmlFor="sedentario" className="dark:text-white">Sedentário (pouco ou nenhum exercício)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="leve" id="leve" />
                    <Label htmlFor="leve" className="dark:text-white">Levemente ativo (1-3 dias/semana)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderado" id="moderado" />
                    <Label htmlFor="moderado" className="dark:text-white">Moderadamente ativo (3-5 dias/semana)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intenso" id="intenso" />
                    <Label htmlFor="intenso" className="dark:text-white">Muito ativo (6-7 dias/semana)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="atleta" id="atleta" />
                    <Label htmlFor="atleta" className="dark:text-white">Atleta (treino intenso diário)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="occupation" className="dark:text-white">Ocupação/Profissão *</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  placeholder="Ex: Desenvolvedor, Professor, etc"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sleepHours" className="dark:text-white">Horas de Sono por Noite *</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    value={formData.sleepHours}
                    onChange={(e) => updateField("sleepHours", e.target.value)}
                    placeholder="Ex: 7"
                    className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <Label className="dark:text-white">Nível de Estresse *</Label>
                  <RadioGroup
                    value={formData.stressLevel}
                    onValueChange={(value) => updateField("stressLevel", value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="baixo" id="baixo" />
                      <Label htmlFor="baixo" className="dark:text-white">Baixo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medio" id="medio" />
                      <Label htmlFor="medio" className="dark:text-white">Médio</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="alto" id="alto" />
                      <Label htmlFor="alto" className="dark:text-white">Alto</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Histórico de Saúde</h2>
              <p className="text-gray-600 dark:text-gray-300">Informações importantes para seu plano</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="dark:text-white">Condições de Saúde (selecione todas que se aplicam)</Label>
                <div className="space-y-3 mt-2">
                  {[
                    "Diabetes",
                    "Hipertensão",
                    "Colesterol Alto",
                    "Problemas Cardíacos",
                    "Problemas de Tireoide",
                    "Ansiedade/Depressão",
                    "Nenhuma",
                  ].map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={formData.healthConditions.includes(condition)}
                        onCheckedChange={() => toggleArrayField("healthConditions", condition)}
                      />
                      <Label htmlFor={condition} className="dark:text-white">{condition}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="medications" className="dark:text-white">Medicamentos em Uso</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => updateField("medications", e.target.value)}
                  placeholder="Liste os medicamentos que você toma regularmente"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="allergies" className="dark:text-white">Alergias Alimentares</Label>
                <Input
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="Ex: Lactose, Glúten, Amendoim"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="previousDiets" className="dark:text-white">Dietas Anteriores</Label>
                <Textarea
                  id="previousDiets"
                  value={formData.previousDiets}
                  onChange={(e) => updateField("previousDiets", e.target.value)}
                  placeholder="Conte sobre dietas que você já tentou e os resultados"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hábitos Alimentares</h2>
              <p className="text-gray-600 dark:text-gray-300">Como é sua alimentação atual</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="dark:text-white">Quantas refeições você faz por dia? *</Label>
                <RadioGroup
                  value={formData.mealsPerDay}
                  onValueChange={(value) => updateField("mealsPerDay", value)}
                  className="flex gap-4 mt-2"
                >
                  {["2", "3", "4", "5", "6+"].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem value={num} id={`meals-${num}`} />
                      <Label htmlFor={`meals-${num}`} className="dark:text-white">{num}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="waterIntake" className="dark:text-white">Consumo de Água Diário (litros) *</Label>
                <Input
                  id="waterIntake"
                  type="number"
                  step="0.5"
                  value={formData.waterIntake}
                  onChange={(e) => updateField("waterIntake", e.target.value)}
                  placeholder="Ex: 2"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <Label className="dark:text-white">Preferências Alimentares (selecione todas que se aplicam)</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-2">
                  {[
                    "Carnes",
                    "Frango",
                    "Peixes",
                    "Ovos",
                    "Laticínios",
                    "Vegetais",
                    "Frutas",
                    "Grãos Integrais",
                    "Leguminosas",
                    "Nozes e Sementes",
                  ].map((food) => (
                    <div key={food} className="flex items-center space-x-2">
                      <Checkbox
                        id={food}
                        checked={formData.foodPreferences.includes(food)}
                        onCheckedChange={() => toggleArrayField("foodPreferences", food)}
                      />
                      <Label htmlFor={food} className="dark:text-white">{food}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="dark:text-white">Restrições Alimentares (selecione todas que se aplicam)</Label>
                <div className="space-y-3 mt-2">
                  {[
                    "Vegetariano",
                    "Vegano",
                    "Sem Glúten",
                    "Sem Lactose",
                    "Low Carb",
                    "Sem Açúcar",
                    "Nenhuma",
                  ].map((restriction) => (
                    <div key={restriction} className="flex items-center space-x-2">
                      <Checkbox
                        id={restriction}
                        checked={formData.restrictions.includes(restriction)}
                        onCheckedChange={() => toggleArrayField("restrictions", restriction)}
                      />
                      <Label htmlFor={restriction} className="dark:text-white">{restriction}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Seus Objetivos</h2>
              <p className="text-gray-600 dark:text-gray-300">O que você quer alcançar</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="dark:text-white">Objetivo Principal *</Label>
                <RadioGroup
                  value={formData.mainGoal}
                  onValueChange={(value) => updateField("mainGoal", value)}
                  className="space-y-3 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="perder-peso" id="perder-peso" />
                    <Label htmlFor="perder-peso" className="dark:text-white">Perder Peso</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ganhar-massa" id="ganhar-massa" />
                    <Label htmlFor="ganhar-massa" className="dark:text-white">Ganhar Massa Muscular</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manter-peso" id="manter-peso" />
                    <Label htmlFor="manter-peso" className="dark:text-white">Manter Peso e Melhorar Saúde</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="definir" id="definir" />
                    <Label htmlFor="definir" className="dark:text-white">Definir o Corpo</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="dark:text-white">Em quanto tempo você quer alcançar seu objetivo? *</Label>
                <RadioGroup
                  value={formData.timeline}
                  onValueChange={(value) => updateField("timeline", value)}
                  className="space-y-3 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3-meses" id="3-meses" />
                    <Label htmlFor="3-meses" className="dark:text-white">3 meses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="6-meses" id="6-meses" />
                    <Label htmlFor="6-meses" className="dark:text-white">6 meses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-ano" id="1-ano" />
                    <Label htmlFor="1-ano" className="dark:text-white">1 ano</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sem-pressa" id="sem-pressa" />
                    <Label htmlFor="sem-pressa" className="dark:text-white">Sem pressa, quero resultados sustentáveis</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="motivation" className="dark:text-white">O que te motiva a mudar? *</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => updateField("motivation", e.target.value)}
                  placeholder="Conte sua história e o que te motivou a buscar essa mudança"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="challenges" className="dark:text-white">Quais são seus maiores desafios? *</Label>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={(e) => updateField("challenges", e.target.value)}
                  placeholder="Ex: Ansiedade, falta de tempo, compulsão alimentar, etc"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Resumo do Seu Perfil</h2>
              <p className="text-gray-600 dark:text-gray-300">Revise suas informações antes de continuar</p>
            </div>

            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-700">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Dados Pessoais</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><strong>Nome:</strong> {formData.name}</p>
                    <p><strong>Idade:</strong> {formData.age} anos</p>
                    <p><strong>Gênero:</strong> {formData.gender}</p>
                    <p><strong>Altura:</strong> {formData.height} cm</p>
                    <p><strong>Peso Atual:</strong> {formData.weight} kg</p>
                    <p><strong>Peso Desejado:</strong> {formData.targetWeight} kg</p>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Meta: Perder {Number(formData.weight) - Number(formData.targetWeight)} kg
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Estilo de Vida</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><strong>Atividade Física:</strong> {formData.activityLevel}</p>
                    <p><strong>Ocupação:</strong> {formData.occupation}</p>
                    <p><strong>Sono:</strong> {formData.sleepHours} horas/noite</p>
                    <p><strong>Estresse:</strong> {formData.stressLevel}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Saúde</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><strong>Condições:</strong> {formData.healthConditions.join(", ") || "Nenhuma"}</p>
                    <p><strong>Alergias:</strong> {formData.allergies || "Nenhuma"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Alimentação</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><strong>Refeições/dia:</strong> {formData.mealsPerDay}</p>
                    <p><strong>Água:</strong> {formData.waterIntake}L/dia</p>
                    <p><strong>Restrições:</strong> {formData.restrictions.join(", ") || "Nenhuma"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Objetivo</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p><strong>Meta:</strong> {formData.mainGoal}</p>
                    <p><strong>Prazo:</strong> {formData.timeline}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ✨ <strong>Próximo passo:</strong> Após o pagamento, você terá acesso ao seu plano personalizado completo com análise de fotos por IA!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 transition-colors">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Etapa {currentStep + 1} de {totalSteps}
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {Math.round(progress)}% completo
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <Card className="p-8 md:p-12 shadow-xl dark:bg-gray-800 dark:border-gray-700">
          {renderStep()}

          {/* Navigation */}
          <div className="flex gap-4 mt-8 pt-8 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2"
            >
              {currentStep === totalSteps - 1 ? "Ir para Pagamento" : "Próximo"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
