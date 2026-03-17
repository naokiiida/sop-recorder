import { useState, useEffect } from "react"
import type { AISettings } from "~lib/types"
import { DEFAULT_AI_SETTINGS } from "~lib/types"
import { getAISettings, setAISettings } from "~lib/storage"

interface Props {
  onSettingsChange?: (settings: AISettings) => void
  /** When true, renders as a full-page layout (for options page) */
  fullPage?: boolean
}

export function SettingsPanel({ onSettingsChange, fullPage = false }: Props) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS)
  const [isOpen, setIsOpen] = useState(fullPage)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getAISettings().then(setSettings)
  }, [])

  const handleSave = async () => {
    await setAISettings(settings)
    onSettingsChange?.(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage()
  }

  if (fullPage) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-xl font-bold mb-1">SOP Recorder 設定</h1>
        <p className="text-sm text-gray-500 mb-6">AI連携やモデルの設定を行います</p>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">AI連携を有効にする</span>
          </label>

          {settings.enabled && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">API URL</label>
                <input
                  type="url"
                  value={settings.apiUrl}
                  onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">API Key</label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">モデル</label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded transition-colors"
          >
            {saved ? "保存しました ✓" : "保存"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 flex items-center justify-between"
      >
        <span>&#x2699; 設定</span>
        <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">AI連携を有効にする</span>
          </label>

          {settings.enabled && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">API URL</label>
                <input
                  type="url"
                  value={settings.apiUrl}
                  onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">API Key</label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">モデル</label>
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded transition-colors"
            >
              {saved ? "保存しました ✓" : "保存"}
            </button>
            <button
              onClick={openOptionsPage}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              詳細設定を開く
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
