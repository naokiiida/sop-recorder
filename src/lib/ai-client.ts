/**
 * OpenAI-compatible API client (BYOK — Bring Your Own Key).
 * Used for AI enhancement of recorded SOP steps.
 */

import type { AISettings, SOPStep } from "./types"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/** Send a chat completion request to an OpenAI-compatible API */
export async function chatCompletion(
  settings: AISettings,
  messages: ChatMessage[]
): Promise<string> {
  const url = `${settings.apiUrl.replace(/\/+$/, "")}/chat/completions`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error ${response.status}: ${errorText}`)
  }

  const data: ChatCompletionResponse = await response.json()
  return data.choices[0]?.message?.content ?? ""
}

/** Enhance raw SOP steps into polished documentation */
export async function enhanceSteps(
  settings: AISettings,
  steps: SOPStep[]
): Promise<string> {
  const stepsText = steps
    .map((s) => {
      const parts = [`${s.order}. [${s.action}]`]
      if (s.target?.accessibleName) parts.push(`Target: ${s.target.accessibleName}`)
      if (s.action === "type" && s.value) parts.push(`Value: ${s.value}`)
      parts.push(`URL: ${s.url}`)
      return parts.join(" | ")
    })
    .join("\n")

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a technical writer. Convert the raw browser interaction steps into a clear, professional Standard Operating Procedure (SOP) document in Markdown format. " +
        "Write in Japanese. Keep it concise but complete. Add context where helpful. " +
        "Do not include the raw step data — rewrite each step as a human-readable instruction."
    },
    {
      role: "user",
      content: `以下の操作ログからSOPドキュメントを生成してください:\n\n${stepsText}`
    }
  ]

  return chatCompletion(settings, messages)
}
