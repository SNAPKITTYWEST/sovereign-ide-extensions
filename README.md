# SnapKitty Sovereign IDE Extensions

Free VS Code extensions for the [SnapKitty Sovereign OS](https://collectivekitty.com) — bringing the MAGMA governance protocol and live WORM chain state directly into your editor.

---

## Extensions

### `magma-protocol` — the command bus

Seal code, anchor decisions, and route agent instructions without leaving VS Code.

| Keybinding | Command | Description |
|------------|---------|-------------|
| `Ctrl+Shift+M` | Open Panel | MAGMA terminal — type § or $ instructions |
| `Ctrl+Shift+S` | Seal selection | Seal highlighted code to WORM chain |
| `Ctrl+Shift+L` | Seal file | Seal current file SHA-256 to chain |
| Right-click | Seal / Anchor | Context menu on any file or selection |

**Auto-completions** — type `§` or `$` and get tier/shorthand suggestions inline.

**On save** (optional) — auto-seals every saved file hash to the chain.

**On commit** — seals every git commit hash to LEDGE automatically.

### `sovereign-status` — live chain state in the status bar

```
$(lock) 7f3a1b2c… · 142    $(circuit-board) 24 AGENTS
```

Polls your SnapKitty OS every 30 seconds. Click either item to open the MAGMA panel or show the chain head.

---

## Quick start

```bash
# Clone this repo
git clone https://github.com/snapkittywest/sovereign-ide-extensions
cd sovereign-ide-extensions

# Install and compile magma-protocol
cd magma-protocol
npm install && npm run compile
# Press F5 in VS Code to launch Extension Development Host

# Install and compile sovereign-status
cd ../sovereign-status
npm install && npm run compile
```

Requires a running [SnapKitty OS](https://collectivekitty.com) instance at `http://localhost:3000` (configurable via settings).

---

## MAGMA Protocol quick reference

```
TIER PREFIXES          $ SHORTHANDS
🔒 SEAL    CIPHER      $seal    — cryptographic seal
📜 ANCHOR  MNEMEX      $anchor  — immutable WORM write
⚡ FLUX    HERALD      $flux    — state transition / broadcast
👁 SENTINEL SENTINEL   $watch   — security monitor (auto-urgent)
🏦 VAULT   VAULT       $vault   — financial authorization
🔮 ORACLE  ORACLE      $query   — knowledge graph query
⚒️ FORGE   FORGE       $forge   — build / deploy action
🧠 NOVA    NOVA        $ask     — synthetic intelligence
💀 LOC     LOC         ← binary outcome. no retry.
```

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `magma.osUrl` | `http://localhost:3000` | SnapKitty OS base URL |
| `magma.sealOnSave` | `false` | Auto-seal file hash on save |
| `magma.sealOnCommit` | `true` | Seal git commit hash to LEDGE |
| `magma.agentDefault` | `FORGE` | Default agent for instructions |
| `sovereignStatus.pollInterval` | `30` | Status bar poll interval (seconds) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  VS Code                                             │
│  magma-protocol extension  ·  sovereign-status       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  SnapKitty OS (localhost:3000)                       │
│  /api/labs/ledge/seal  ·  /api/merkle/root           │
│  WORM chain · 24 agents · MAGMA · Merkle root        │
└─────────────────────────────────────────────────────┘
```

---

## Related

- [LEDGE](https://github.com/snapkittywest/ledge) — open-source WORM chain (Rust + WASM)
- [SnapKitty OS](https://collectivekitty.com) — the sovereign AI operating system
- [Live chain explorer](https://collectivekitty.com/labs/ledge)
- [Honeypot live feed](https://collectivekitty.com/labs/sentinel)

---

*MIT License · SnapKitty Collective · 2026*
*"The development environment that seals every decision."*

![](https://sovereign-analytics.snapkittywest.workers.dev/canary/sovereign-ide-extensions)
