import type { SOPStep } from "~lib/types"
import { StepCard } from "./StepCard"

interface Props {
  steps: SOPStep[]
  onUpdateStep: (stepId: string, updates: Partial<Pick<SOPStep, "title" | "description">>) => void
  onDeleteStep: (stepId: string) => void
}

export function StepList({ steps, onUpdateStep, onDeleteStep }: Props) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-lg mb-1">ステップなし</p>
        <p className="text-xs">録画中の操作がここに表示されます</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4">
      {steps.map((step) => (
        <StepCard
          key={step.id}
          step={step}
          onUpdate={onUpdateStep}
          onDelete={onDeleteStep}
        />
      ))}
    </div>
  )
}
