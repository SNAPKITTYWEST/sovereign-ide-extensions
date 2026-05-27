import * as vscode from 'vscode'

interface ChainStatus {
  head?:       string
  eventCount?: number
  merkleRoot?: string
  db?:         string
}

export function activate(context: vscode.ExtensionContext) {
  const config    = () => vscode.workspace.getConfiguration('sovereignStatus')
  const osUrl     = () => config().get<string>('osUrl', 'http://localhost:3000')
  const pollMs    = () => (config().get<number>('pollInterval', 30)) * 1000

  // ── Status bar items ───────────────────────────────────────────────────────

  const chainItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000)
  chainItem.command   = 'magma.chainHead'
  chainItem.tooltip   = 'SnapKitty WORM chain — click to show head'
  chainItem.text      = '$(lock) WORM …'
  chainItem.color     = '#00ff88'
  chainItem.show()

  const agentItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 999)
  agentItem.command   = 'magma.panel'
  agentItem.tooltip   = 'SnapKitty OS — click to open MAGMA panel'
  agentItem.text      = '$(circuit-board) OS …'
  agentItem.color     = '#27272a'
  agentItem.show()

  context.subscriptions.push(chainItem, agentItem)

  // ── Poll ───────────────────────────────────────────────────────────────────

  async function poll() {
    try {
      const [healthRes, merkleRes] = await Promise.allSettled([
        fetch(`${osUrl()}/api/health`,       { signal: AbortSignal.timeout(3000) }),
        fetch(`${osUrl()}/api/merkle/root`,   { signal: AbortSignal.timeout(3000) }),
      ])

      let db         = 'OFFLINE'
      let merkleRoot = ''
      let eventCount = 0

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const h = await healthRes.value.json()
        db = h.db ?? 'OK'
      }

      if (merkleRes.status === 'fulfilled' && merkleRes.value.ok) {
        const m = await merkleRes.value.json()
        merkleRoot = m.merkleRoot ?? m.root ?? ''
        eventCount = m.eventCount ?? m.count ?? 0
      }

      const isOnline = db !== 'OFFLINE'
      chainItem.text  = isOnline
        ? `$(lock) ${merkleRoot.slice(0, 8) || 'WORM'}… · ${eventCount}`
        : `$(lock) OFFLINE`
      chainItem.color = isOnline ? '#00ff88' : '#ef4444'

      agentItem.text  = isOnline ? `$(circuit-board) 11 AGENTS` : `$(circuit-board) OS OFFLINE`
      agentItem.color = isOnline ? '#27272a' : '#ef4444'

    } catch {
      chainItem.text  = `$(lock) OFFLINE`
      chainItem.color = '#ef4444'
      agentItem.text  = `$(circuit-board) OS OFFLINE`
      agentItem.color = '#ef4444'
    }
  }

  poll()
  const interval = setInterval(poll, pollMs())
  context.subscriptions.push({ dispose: () => clearInterval(interval) })

  // Re-poll when config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('sovereignStatus')) { clearInterval(interval); poll() }
    })
  )
}

export function deactivate() {}
