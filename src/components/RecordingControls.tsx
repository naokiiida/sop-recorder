import { useState, useEffect, useRef } from "react"
import type { RecordingStatus } from "~lib/types"

interface Props {
  status: RecordingStatus
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
}

export function RecordingControls({ status, onStart, onStop, onPause, onResume }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === "recording") {
      if (!startTimeRef.current) startTimeRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else if (status === "idle" || status === "stopped") {
      startTimeRef.current = 0
      setElapsed(0)
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else if (status === "paused") {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div className="flex items-center gap-3 p-4">
      {status === "idle" || status === "stopped" ? (
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          <span className="w-3 h-3 rounded-full bg-white" />
          録画開始
        </button>
      ) : (
        <>
          <button
            onClick={onStop}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            ■ 停止
          </button>
          {status === "recording" ? (
            <button
              onClick={onPause}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              ⏸ 一時停止
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              ▶ 再開
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {status === "recording" && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <span className="font-mono text-lg">{formatTime(elapsed)}</span>
          </div>
        </>
      )}
    </div>
  )
}
