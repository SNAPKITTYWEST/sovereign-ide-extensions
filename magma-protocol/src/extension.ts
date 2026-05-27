import * as vscode from 'vscode'
import * as crypto from 'crypto'
import { MagmaPanel }  from './magma-panel'
import { ChainView }   from './chain-view'
import { sealToChain, getChainHead } from './worm-client'

// ── Emoji tier map (mirrors lib/magma/emoji-protocol.ts) ─────────────────────

const TIERS: Record<string, { verb: string; agent: string; action: string; color: string }> = {
  '🔒': { verb: 'SEAL',   agent: 'CIPHER',   action: 'SIGN',      color: '#00ff88' },
  '📜': { verb: 'ANCHOR', agent: 'MNEMEX',   action: 'WORM',      color: '#6366f1' },
  '⚡': { verb: 'FLUX',   agent: 'HERALD',   action: 'BROADCAST', color: '#fbbf24' },
  '👁': { verb: 'BIND',   agent: 'SENTINEL', action: 'MONITOR',   color: '#ef4444' },
  '🏦': { verb: 'VAULT',  agent: 'VAULT',    action: 'APPROVE',   color: '#fbbf24' },
  '🔮': { verb: 'QUERY',  agent: 'ORACLE',   action: 'KNOWLEDGE', color: '#a78bfa' },
  '⚒️': { verb: 'FORGE',  agent: 'FORGE',    action: 'BUILD',     color: '#f97316' },
  '🧠': { verb: 'QUERY',  agent: 'NOVA',     action: 'SYNTHETIC', color: '#8b5cf6' },
  '💀': { verb: 'FORGE',  agent: 'FORGE',    action: 'CHAIN',     color: '#6b7280' },
}

// ── Activation ────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  const config  = () => vscode.workspace.getConfiguration('magma')
  const osUrl   = () => config().get<string>('osUrl', 'http://localhost:3000')
  const chainView = new ChainView(context, osUrl)

  // ── Commands ────────────────────────────────────────────────────────────────

  context.subscriptions.push(
    vscode.commands.registerCommand('magma.panel', () => {
      MagmaPanel.createOrShow(context.extensionUri, osUrl())
    }),

    vscode.commands.registerCommand('magma.seal', async () => {
      const editor = vscode.window.activeTextEditor
      const text   = editor?.document.getText(editor.selection) ?? ''
      if (!text) { vscode.window.showWarningMessage('Select text to seal'); return }
      const result = await sealToChain(osUrl(), { event: 'SELECTION_SEAL', text: text.slice(0, 500) })
      if (result) {
        vscode.window.showInformationMessage(`🔒 Sealed · ${result.seal?.slice(0, 16)}…`)
        chainView.refresh()
      }
    }),

    vscode.commands.registerCommand('magma.sealFile', async () => {
      const doc = vscode.window.activeTextEditor?.document
      if (!doc) { vscode.window.showWarningMessage('No active file'); return }
      const hash = crypto.createHash('sha256').update(doc.getText()).digest('hex')
      const result = await sealToChain(osUrl(), {
        event:    'FILE_SEAL',
        file:     doc.fileName.split(/[\\/]/).pop(),
        sha256:   hash,
        language: doc.languageId,
      })
      if (result) {
        vscode.window.showInformationMessage(`🔒 File sealed · ${result.seal?.slice(0, 16)}…`)
        chainView.refresh()
      }
    }),

    vscode.commands.registerCommand('magma.anchor', async () => {
      const input = await vscode.window.showInputBox({ prompt: '📜 Anchor payload (k:v or JSON)', placeHolder: 'session:"work" milestone:"v1"' })
      if (!input) return
      const result = await sealToChain(osUrl(), { event: 'ANCHOR', data: input })
      if (result) vscode.window.showInformationMessage(`📜 Anchored to WORM · ${result.seal?.slice(0, 16)}…`)
    }),

    vscode.commands.registerCommand('magma.vault', async () => {
      const amount  = await vscode.window.showInputBox({ prompt: '🏦 Amount (USD)', placeHolder: '50000' })
      const vendor  = await vscode.window.showInputBox({ prompt: '🏦 Vendor', placeHolder: 'Acme Corp' })
      if (!amount) return
      const result  = await sealToChain(osUrl(), { event: 'VAULT_APPROVE', amount: Number(amount), vendor: vendor ?? 'unknown' })
      if (result) vscode.window.showInformationMessage(`🏦 VAULT sealed · $${Number(amount).toLocaleString()} · ${result.seal?.slice(0, 16)}…`)
    }),

    vscode.commands.registerCommand('magma.flux', async () => {
      const msg = await vscode.window.showInputBox({ prompt: '⚡ Broadcast message', placeHolder: 'Deploy complete' })
      if (!msg) return
      const result = await sealToChain(osUrl(), { event: 'FLUX_BROADCAST', message: msg })
      if (result) vscode.window.showInformationMessage(`⚡ Broadcast sealed · ${result.seal?.slice(0, 16)}…`)
    }),

    vscode.commands.registerCommand('magma.forge', async () => {
      const job = await vscode.window.showInputBox({ prompt: '⚒️ Forge job', placeHolder: 'build:prod or test:all' })
      if (!job) return
      const result = await sealToChain(osUrl(), { event: 'FORGE_BUILD', job })
      if (result) vscode.window.showInformationMessage(`⚒️ FORGE sealed · ${result.seal?.slice(0, 16)}…`)
    }),

    vscode.commands.registerCommand('magma.watch', async () => {
      const source = await vscode.window.showInputBox({ prompt: '👁 Source to monitor', placeHolder: 'ip:192.168.1.99 or user:unknown' })
      if (!source) return
      const result = await sealToChain(osUrl(), { event: 'SENTINEL_MONITOR', source })
      if (result) vscode.window.showInformationMessage(`👁 SENTINEL sealed · ${result.seal?.slice(0, 16)}…`)
    }),

    vscode.commands.registerCommand('magma.query', async () => {
      const topic = await vscode.window.showInputBox({ prompt: '🔮 Oracle query', placeHolder: 'threat analysis / revenue forecast' })
      if (!topic) return
      MagmaPanel.createOrShow(context.extensionUri, osUrl())
      MagmaPanel.postMessage({ type: 'query', topic })
    }),

    vscode.commands.registerCommand('magma.chainHead', async () => {
      const head = await getChainHead(osUrl())
      vscode.window.showInformationMessage(`📜 Chain head: ${head?.slice(0, 32) ?? 'unreachable'}…`)
    }),
  )

  // ── Auto-seal on save (optional) ────────────────────────────────────────────

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async doc => {
      if (!config().get<boolean>('sealOnSave', false)) return
      const hash = crypto.createHash('sha256').update(doc.getText()).digest('hex')
      await sealToChain(osUrl(), { event: 'AUTO_SAVE_SEAL', file: doc.fileName.split(/[\\/]/).pop(), sha256: hash })
      chainView.refresh()
    })
  )

  // ── Git commit hook (seal on commit) ────────────────────────────────────────

  const gitExt = vscode.extensions.getExtension('vscode.git')?.exports
  if (gitExt && config().get<boolean>('sealOnCommit', true)) {
    try {
      const api = gitExt.getAPI(1)
      api.onDidOpenRepository((repo: { state: { onDidChange: (cb: () => void) => void; HEAD: { commit?: string } } }) => {
        let lastCommit = repo.state.HEAD?.commit
        repo.state.onDidChange(async () => {
          const current = repo.state.HEAD?.commit
          if (current && current !== lastCommit) {
            lastCommit = current
            await sealToChain(osUrl(), { event: 'GIT_COMMIT_SEAL', commit: current })
            chainView.refresh()
          }
        })
      })
    } catch { /* git extension unavailable */ }
  }

  // ── Inline MAGMA completions (type § or $ and get suggestions) ────────────────

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: 'file' },
      {
        provideCompletionItems(document, position) {
          const line = document.lineAt(position).text.slice(0, position.character)
          if (!line.trimEnd().endsWith('§') && !line.trimEnd().endsWith('$')) return

          const items: vscode.CompletionItem[] = []

          if (line.trimEnd().endsWith('§')) {
            for (const [emoji, tier] of Object.entries(TIERS)) {
              const item = new vscode.CompletionItem(`${emoji}§${tier.verb}:${tier.agent}:${tier.action}{}`, vscode.CompletionItemKind.Event)
              item.detail      = `MAGMA ${tier.verb} via ${tier.agent}`
              item.insertText  = new vscode.SnippetString(`${emoji}§${tier.verb}:${tier.agent}:${tier.action}{"$1"}`)
              item.sortText    = `0${tier.verb}`
              items.push(item)
            }
          }

          if (line.trimEnd().endsWith('$')) {
            for (const [key, tier] of Object.entries({
              seal:'🔒', vault:'🏦', anchor:'📜', flux:'⚡', forge:'⚒️',
              watch:'👁', query:'🔮', ask:'🧠', send:'📡', lock:'🔐',
            })) {
              const t = TIERS[tier as string]
              if (!t) continue
              const item = new vscode.CompletionItem(`$${key}`, vscode.CompletionItemKind.Keyword)
              item.detail     = `${tier} ${t.verb}:${t.agent}:${t.action}`
              item.insertText = new vscode.SnippetString(`$${key} \${1:payload}`)
              item.sortText   = `0${key}`
              items.push(item)
            }
          }

          return items
        },
      },
      '§', '$'
    )
  )

  vscode.window.showInformationMessage('§ MAGMA Protocol active — sovereign IDE online')
}

export function deactivate() {}
