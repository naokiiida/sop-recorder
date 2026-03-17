@suggestion.md 

we don't need to limit to claude sdk and api. if we go openai-api format compatible we can use many models and evaluate them, and allow user to BYOK and url. 
this goes for transcription and formatting, although those can be manual, since i have spokenly app to do it for me, mvp is getting clicks screenshot and audio/video recording and steps. 

/Users/naokiiida/Documents/4_clone/0_browser-extensions contains some extracted chrome extensions like claude in chrome, guidechimp, glitter-ai, scribe.
for screen recording, https://github.com/alyssaxuu/screenity may be a good reference.

#### Scribe拡張機能分析 — IN PROGRESS
`claude --resume 01c20fb6-314b-4569-a891-bb38ac04575e`
- `/Users/naokiiida/Documents/4_clone/0_browser-extensions/Scribe/` の解析
- **自分の pyproject.toml を ExtAnalysis に追加済み** (`/Users/naokiiida/Documents/4_clone/0_browser-extensions/ExtAnalysis`)
- ペイウォール回避はクライアント側フラグだけでは不可 (サーバー側バリデーションあり)
- 自分用の代替プロダクト構築の可能性を検討中

