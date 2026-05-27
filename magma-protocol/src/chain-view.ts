import * as vscode from 'vscode'
import { getRecentEvents } from './worm-client'

// ── Chain View — sidebar tree showing recent WORM events ──────────────────────

export class ChainView implements vscode.TreeDataProvider<ChainItem> {
  private _onDidChange = new vscode.EventEmitter<ChainItem | undefined | void>()
  readonly onDidChangeTreeData = this._onDidChange.event
  private _events: unknown[] = []

  constructor(
    context: vscode.ExtensionContext,
    private readonly osUrl: () => string,
  ) {
    vscode.window.registerTreeDataProvider('magma.chainView', this)
    this.refresh()
    // Poll every 15 seconds
    const interval = setInterval(() => this.refresh(), 15_000)
    context.subscriptions.push({ dispose: () => clearInterval(interval) })
  }

  async refresh() {
    this._events = await getRecentEvents(this.osUrl(), 20)
    this._onDidChange.fire()
  }

  getTreeItem(el: ChainItem): vscode.TreeItem { return el }

  getChildren(el?: ChainItem): ChainItem[] {
    if (el) return []
    if (!this._events.length) return [new ChainItem('Chain empty', '', vscode.TreeItemCollapsibleState.None)]

    return this._events.slice(0, 20).map((e: unknown, i: number) => {
      const ev     = e as Record<string, unknown>
      const trace  = ev.agentTrace as Record<string, unknown> | null
      const seal   = (trace?.seal as string)?.slice(0, 12) ?? ev.id?.toString().slice(0, 12) ?? '?'
      const agent  = (trace?.agent as string) ?? (ev.source as string) ?? '?'
      const type   = (ev.eventType as string) ?? 'EVENT'
      const label  = `${String(i).padStart(3, '0')} · ${seal}… · ${agent}`
      const detail = type
      return new ChainItem(label, detail, vscode.TreeItemCollapsibleState.None)
    })
  }
}

class ChainItem extends vscode.TreeItem {
  constructor(
    label: string,
    detail: string,
    state: vscode.TreeItemCollapsibleState,
  ) {
    super(label, state)
    this.description = detail
    this.iconPath    = new vscode.ThemeIcon('lock')
  }
}
