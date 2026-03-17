import { useState } from "react"
import type { SOPStep } from "~lib/types"

interface Props {
  step: SOPStep
  onUpdate: (stepId: string, updates: Partial<Pick<SOPStep, "title" | "description">>) => void
  onDelete: (stepId: string) => void
}

const ACTION_LABELS: Record<string, string> = {
  click: "クリック",
  type: "入力",
  scroll: "スクロール",
  navigate: "ナビゲーション",
  tab_switch: "タブ切替"
}

const ACTION_COLORS: Record<string, string> = {
  click: "bg-blue-100 text-blue-700",
  type: "bg-green-100 text-green-700",
  scroll: "bg-purple-100 text-purple-700",
  navigate: "bg-orange-100 text-orange-700",
  tab_switch: "bg-yellow-100 text-yellow-700"
}

function autoTitle(step: SOPStep): string {
  const label = ACTION_LABELS[step.action] || step.action
  const name = step.target?.accessibleName
  if (name) return `「${name.slice(0, 40)}」を${label}`
  if (step.action === "navigate") return `${new URL(step.url).hostname} へ${label}`
  return label
}

export function StepCard({ step, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(step.title || "")
  const [editDesc, setEditDesc] = useState(step.description || "")

  const displayTitle = step.title || autoTitle(step)

  const handleSave = () => {
    onUpdate(step.id, {
      title: editTitle || undefined,
      description: editDesc || undefined
    })
    setIsEditing(false)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, "0")}`
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 group">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {step.screenshotDataUrl && (
          <img
            src={step.screenshotDataUrl}
            alt={`Step ${step.order}`}
            className="w-24 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-400">
              {step.order}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${ACTION_COLORS[step.action] || "bg-gray-100 text-gray-600"}`}>
              {ACTION_LABELS[step.action] || step.action}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {formatTime(step.timeSinceStart)}
            </span>
          </div>

          {/* Title */}
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="ステップタイトル"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="詳細説明（オプション）"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 h-16 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} className="text-xs px-2 py-1 bg-blue-500 text-white rounded">
                  保存
                </button>
                <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 bg-gray-200 rounded">
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium truncate">{displayTitle}</p>
          )}

          {!isEditing && step.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{step.description}</p>
          )}

          {/* Value for type actions */}
          {!isEditing && step.action === "type" && step.value && (
            <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
              → {step.value}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-blue-500 p-1"
              title="編集"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(step.id)}
              className="text-xs text-gray-400 hover:text-red-500 p-1"
              title="削除"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
