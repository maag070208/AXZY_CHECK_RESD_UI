import React from "react";

interface Step {
  label: string;
  icon?: React.ReactNode;
}

interface ITStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

/**
 * ITStepper - Professional progress indicator
 * emerald/slate administrative aesthetic
 */
export const ITStepper: React.FC<ITStepperProps> = ({
  steps,
  currentStep,
  className = "",
}) => {
  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="relative flex justify-between">
        {/* Background Connector Line */}
        <div className="absolute top-[22px] left-[10%] right-[10%] h-[2px] bg-slate-100 rounded-full" />

        {/* Progress Connector Line */}
        <div
          className="absolute top-[22px] left-[10%] h-[2px] bg-emerald-500 rounded-full transition-all duration-700 ease-in-out"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 80}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div
              key={index}
              className="relative z-10 flex flex-col items-center flex-1"
            >
              {/* Step Circle */}
              <div
                className={`
                  w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all duration-500
                  border-2 bg-white
                  ${
                    isCompleted || isActive
                      ? "border-emerald-500 shadow-xl shadow-emerald-100"
                      : "border-slate-100"
                  }
                  ${isActive ? "scale-110 ring-[6px] ring-emerald-50" : ""}
                `}
              >
                <div
                  className={`
                  transition-colors duration-300
                  ${
                    isCompleted || isActive
                      ? "text-emerald-500"
                      : "text-slate-200"
                  }
                `}
                >
                  {step.icon ? (
                    <span className="text-xl">{step.icon}</span>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
              </div>

              {/* Step Label */}
              <div className="mt-4 flex flex-col items-center">
                <span
                  className={`
                  text-[10px] font-black uppercase tracking-[0.15em] text-center
                  transition-all duration-300
                  ${isActive ? "text-emerald-600 translate-y-[-2px]" : "text-slate-300"}
                `}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
