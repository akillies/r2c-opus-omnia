import { Check } from "lucide-react";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function StepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center justify-between mb-12">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <button
              onClick={() => onStepClick(index)}
              className={`step-indicator w-12 h-12 rounded-lg flex items-center justify-center font-bold transition-all duration-300 ${
                index <= currentStep
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-white border-2 border-slate-300 text-slate-400'
              }`}
              data-testid={`step-indicator-${index}`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </button>
            <div className={`mt-2 text-sm font-semibold transition-colors ${
              index <= currentStep ? 'text-slate-900' : 'text-slate-400'
            }`}>
              {step}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`progress-line flex-1 h-1 mx-4 transition-all duration-300 ${
              index < currentStep ? 'bg-primary' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
