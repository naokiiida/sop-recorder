import type { SOPRecording } from "~lib/types"

interface Props {
  recording: SOPRecording | null
  onExport: () => void
  onAIEnhance?: () => void
  isExporting: boolean
  aiEnabled: boolean
}

export function ExportPanel({ recording, onExport, onAIEnhance, isExporting, aiEnabled }: Props) {
  if (!recording || recording.status !== "stopped") return null

  return (
    <div className="border-t border-gray-200 p-4 space-y-3">
      <div className="text-sm text-gray-600">
        <p>{recording.steps.length} ステップ記録済み</p>
        {recording.videoBlobUrl && (
          <p className="text-xs text-green-600 mt-1">動画録画あり</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
        >
          {isExporting ? "エクスポート中..." : "Markdown ZIPエクスポート"}
        </button>

        {aiEnabled && onAIEnhance && (
          <button
            onClick={onAIEnhance}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
          >
            AI整形
          </button>
        )}
      </div>
    </div>
  )
}
