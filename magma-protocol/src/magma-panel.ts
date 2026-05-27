import * as vscode from 'vscode'
import { sealToChain } from './worm-client'

// ── MAGMA Panel — sovereign instruction terminal ──────────────────────────────
// A webview panel where you type emoji/$ instructions and get agent responses.
// Looks like a terminal but routes to your sovereign OS.

export class MagmaPanel {
  static current: MagmaPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private readonly _osUrl: () => string
  private _disposables: vscode.Disposable[] = []

  static createOrShow(extensionUri: vscode.Uri, osUrl: string) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One

    if (MagmaPanel.current) {
      MagmaPanel.current._panel.reveal(column)
      MagmaPanel.current._osUrl = () => osUrl
      return
    }

    const panel = vscode.window.createWebviewPanel(
      'magmaPanel',
      '§ MAGMA',
      column,
      { enableScripts: true, retainContextWhenHidden: true },
    )

    MagmaPanel.current = new MagmaPanel(panel, () => osUrl)
  }

  static postMessage(msg: unknown) {
    MagmaPanel.current?._panel.webview.postMessage(msg)
  }

  private constructor(panel: vscode.WebviewPanel, osUrl: () => string) {
    this._panel = panel
    this._osUrl = osUrl
    this._panel.webview.html = this._getHtml()

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.webview.onDidReceiveMessage(async msg => {
      if (msg.type === 'instruction') {
        const result = await this._execute(msg.text)
        this._panel.webview.postMessage({ type: 'result', text: result, input: msg.text })
      }
    }, null, this._disposables)
  }

  private async _execute(raw: string): Promise<string> {
    const trimmed = raw.trim()
    let payload: Record<string, unknown> = { raw: trimmed }

    // Parse $ shorthand or emoji prefix into payload
    if (trimmed.startsWith('$') || /^[\u{1F000}-\u{1FFFF}]/u.test(trimmed)) {
      payload = { event: 'MAGMA_INSTRUCTION', instruction: trimmed }
    }

    const result = await sealToChain(this._osUrl(), payload)
    if (!result) return '⚠ OS unreachable — check SnapKitty OS is running at ' + this._osUrl()

    return [
      `🔒 SEALED`,
      `   seal:  ${result.seal}`,
      `   prev:  ${result.previousSeal?.slice(0, 32)}…`,
      `   index: ${result.index}`,
      `   ts:    ${result.timestamp}`,
    ].join('\n')
  }

  dispose() {
    MagmaPanel.current = undefined
    this._panel.dispose()
    this._disposables.forEach(d => d.dispose())
  }

  private _getHtml(): string {
    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>§ MAGMA</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #030306; color: #00ff88;
    font-family: 'Space Mono', 'Courier New', monospace;
    font-size: 12px; height: 100vh;
    display: flex; flex-direction: column;
  }
  #header {
    padding: 10px 16px; border-bottom: 1px solid #0d0d0d;
    display: flex; align-items: center; justify-content: space-between;
  }
  #header h1 { font-size: 11px; letter-spacing: 0.18em; color: #00ff88; }
  #header small { font-size: 9px; color: #1a1a1a; letter-spacing: 0.08em; }
  #output {
    flex: 1; overflow-y: auto; padding: 12px 16px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .line-in  { color: #333; }
  .line-in::before { content: '§ '; color: #00ff88; }
  .line-out { color: #1a6640; white-space: pre; font-size: 10px; padding-left: 12px; border-left: 1px solid #0a2a18; }
  .line-err { color: #7f1d1d; white-space: pre; padding-left: 12px; }
  #input-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-top: 1px solid #0d0d0d;
  }
  #prompt { color: #00ff88; font-size: 12px; flex-shrink: 0; }
  #input {
    flex: 1; background: transparent; border: none; outline: none;
    color: #666; font-family: inherit; font-size: 12px; caret-color: #00ff88;
  }
  #input::placeholder { color: #111; }
  #hint { font-size: 9px; color: #0d0d0d; letter-spacing: 0.06em; padding: 4px 16px; }
</style>
</head>
<body>
<div id="header">
  <h1>§ MAGMA PROTOCOL</h1>
  <small>SOVEREIGN IDE · SnapKitty OS</small>
</div>
<div id="output" id="output">
  <div class="line-out">MAGMA Emoji Protocol online.
Type § or $ instructions below.

  🔒 §SEAL:CIPHER:SIGN{"decision":"..."}
  $vault amount:50000 vendor:"Acme"
  $seal decision:"deploy v4" agent:FORGE
  $magma  ← show all tiers and shorthands

Every instruction is sealed to your WORM chain.</div>
</div>
<div id="hint">§ TIERS: 🔒📜⚡👁🏦📡🔮⚒️🧠🌊🔐💀📊🌑 · $ SHORTHANDS: $seal $vault $anchor $flux $forge $watch $query $ask</div>
<div id="input-row">
  <span id="prompt">§</span>
  <input id="input" type="text" autocomplete="off" spellcheck="false" placeholder="🔒 §SEAL:... or $vault amount:50000" />
</div>
<script>
  const vscode  = acquireVsCodeApi()
  const output  = document.getElementById('output')
  const input   = document.getElementById('input')
  const history = []
  let histIdx   = -1

  function append(cls, text) {
    const el = document.createElement('div')
    el.className = cls
    el.textContent = text
    output.appendChild(el)
    output.scrollTop = output.scrollHeight
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim()
      if (!val) return
      history.unshift(val)
      histIdx = -1
      append('line-in', val)
      input.value = ''

      if (val === '$magma' || val === '§help') {
        append('line-out',
          'TIERS:\\n' +
          '🔒 SEAL     CIPHER   — cryptographic seal\\n' +
          '📜 ANCHOR   MNEMEX   — immutable WORM write\\n' +
          '⚡ FLUX     HERALD   — broadcast/state transition\\n' +
          '👁 SENTINEL SENTINEL — security watch (auto-urgent)\\n' +
          '🏦 VAULT    VAULT    — financial authorization\\n' +
          '📡 HERALD   HERALD   — broadcast routing\\n' +
          '🔮 ORACLE   ORACLE   — knowledge query\\n' +
          '⚒️ FORGE    FORGE    — build/deploy action\\n' +
          '🧠 NOVA     NOVA     — synthetic intelligence\\n' +
          '💀 LOC      FORGE    — binary/kinetic, no retry\\n\\n' +
          'SHORTHANDS: $seal $vault $anchor $flux $forge $watch $query $ask $send $lock $score'
        )
        return
      }

      vscode.postMessage({ type: 'instruction', text: val })
    }
    if (e.key === 'ArrowUp')   { histIdx = Math.min(histIdx + 1, history.length - 1); input.value = history[histIdx] ?? '' }
    if (e.key === 'ArrowDown') { histIdx = Math.max(histIdx - 1, -1);                 input.value = histIdx < 0 ? '' : history[histIdx] }
  })

  window.addEventListener('message', e => {
    const msg = e.data
    if (msg.type === 'result') append('line-out', msg.text)
    if (msg.type === 'error')  append('line-err', msg.text)
    if (msg.type === 'query')  { input.value = '$query topic:' + msg.topic; input.focus() }
  })

  input.focus()
</script>
</body>
</html>`
  }
}
