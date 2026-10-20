<p align="center">
  <a href="https://github.com/NarimanKhaleghi/opencode-hotkeys">
    <img src="assets/banner.svg" alt="Hotkeys for OpenCode" width="100%">
  </a>
</p>

<p align="center">
  <strong>Browser-style session switching and an Obsidian-style hotkey studio for OpenCode.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/opencode-hotkeys"><img src="https://img.shields.io/npm/v/opencode-hotkeys?color=f5a524" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/opencode-hotkeys"><img src="https://img.shields.io/npm/dm/opencode-hotkeys" alt="npm downloads"></a>
  <a href="https://github.com/NarimanKhaleghi/opencode-hotkeys/actions/workflows/ci.yml"><img src="https://github.com/NarimanKhaleghi/opencode-hotkeys/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/opencode-hotkeys?color=blue" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/OpenCode-1.x%20%7C%202.x-111827" alt="OpenCode 1.x and 2.x">
</p>

<p align="center">
  <a href="./README.fa.md">فارسی</a> ·
  <a href="#install">Install</a> ·
  <a href="#shortcuts">Shortcuts</a> ·
  <a href="#hotkey-studio">Hotkey Studio</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

**Hotkeys for OpenCode** adds the shortcuts you already use in a browser and an editor to the OpenCode TUI:

- `Alt+T` starts a new session.
- `Alt+1…9` jumps between sessions.
- `Alt+PageUp` / `Alt+PageDown` cycles sessions.
- `Alt+O` opens a searchable session picker.
- `Alt+K` opens **Hotkey Studio** to search, inspect, and rebind every action.
- `Alt+I` shows the active preset and every shortcut.

It is local-first: no network calls, no telemetry, and no runtime dependency on OpenCode packages.

> **Terminal TUI only.** The OpenCode desktop app (Electron) does not load TUI plugins yet. Run `opencode` in a terminal to use these shortcuts.

<p align="center">
  <img src="assets/hotkey-studio.svg" alt="Hotkey Studio" width="86%">
</p>

## Why

OpenCode is excellent at keeping many sessions alive, but switching between them from the keyboard is still limited. This plugin adds a small, predictable layer on top of the existing TUI:

- **Native-first by default.** The default preset avoids every shortcut OpenCode already uses.
- **No fork, no patch.** It is a normal TUI plugin.
- **Rebind everything.** Hotkey Studio catches the next key you press and checks for conflicts.
- **Presets, not lock-in.** Choose `native`, `browser`, or `notes`, then override only what you need.
- **Session-aware.** Quick slots prefer pinned sessions, then recent sessions, and fall back to the newest ones.

## Install

### 1. From GitHub (available now)

```bash
git clone https://github.com/NarimanKhaleghi/opencode-hotkeys.git ~/.local/share/opencode-hotkeys
realpath ~/.local/share/opencode-hotkeys/tui.ts
```

Add the printed absolute path to your global TUI config (usually `~/.config/opencode/tui.json`):

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["/absolute/path/to/opencode-hotkeys/tui.ts", { "preset": "native" }]]
}
```

Restart OpenCode and press `Alt+I` to confirm that the plugin loaded.

> Use `tui.json`, not `opencode.json`. TUI plugins are loaded from the TUI config.

### 2. From npm (when the release is published)

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["opencode-hotkeys", { "preset": "native" }]]
}
```

Then restart OpenCode and press `Alt+I` to confirm that the plugin loaded.

### 3. Or run the installer

```bash
npx opencode-hotkeys
# or
bunx opencode-hotkeys
```

The installer edits your global `tui.json` while keeping comments and formatting:

```bash
npx opencode-hotkeys --preset browser
npx opencode-hotkeys --bind hotkeys.new=alt+n
npx opencode-hotkeys --debug
npx opencode-hotkeys --uninstall
```

Use `--config <path>` to target another file and `--print` to preview the result without writing it.

### 4. Or install from the OpenCode CLI

```bash
opencode plugin opencode-hotkeys --global
```

If your build keeps TUI plugins in a separate file, add the `tui.json` entry above as well.

## Shortcuts

### Native first (default)

| Shortcut       | Action                   |
| -------------- | ------------------------ |
| `Alt+T`        | New session              |
| `Alt+O`        | Session picker           |
| `Alt+PageDown` | Next session             |
| `Alt+PageUp`   | Previous session         |
| `Alt+1…9`      | Switch to quick slot 1…9 |
| `Alt+K`        | Hotkey Studio            |
| `Alt+I`        | Hotkeys help             |

The native preset deliberately avoids shortcuts OpenCode already owns. It is the safest choice for a first install.

### Browser

| Shortcut         | Action                   |
| ---------------- | ------------------------ |
| `Ctrl+T`         | New session              |
| `Ctrl+L`         | Session picker           |
| `Ctrl+Tab`       | Next session             |
| `Ctrl+Shift+Tab` | Previous session         |
| `Ctrl+1…9`       | Switch to quick slot 1…9 |
| `Alt+K`          | Hotkey Studio            |
| `Alt+I`          | Hotkeys help             |

`Ctrl+Tab` and `Ctrl+1…9` are intercepted by some terminals before OpenCode sees them. On macOS, enable **Option as Meta** in your terminal if `Alt` shortcuts do not arrive.

### Notes

| Shortcut         | Action                   |
| ---------------- | ------------------------ |
| `Ctrl+N`         | New session              |
| `Ctrl+O`         | Session picker           |
| `Ctrl+Tab`       | Next session             |
| `Ctrl+Shift+Tab` | Previous session         |
| `Alt+1…9`        | Switch to quick slot 1…9 |
| `Alt+K`          | Hotkey Studio            |
| `Alt+I`          | Hotkeys help             |

### Slash commands

| Command     | Opens          |
| ----------- | -------------- |
| `/keys`     | Hotkey Studio  |
| `/hotkeys`  | Hotkeys help   |
| `/sessions` | Session picker |

## Hotkey Studio

Press `Alt+K` or type `/keys`.

- **Search** every action by title.
- **Inspect** the current binding and description.
- **Rebind** by selecting _Rebind shortcut_ and pressing the new combination.
- **Clear** a binding without assigning a replacement.
- **Reset** one action or every override back to the selected preset.
- **Switch presets** without editing JSON.
- **See conflicts** with other plugin actions and with OpenCode's native shortcuts before applying them.

Studio changes apply immediately. They are stored in OpenCode's local state and restored on restart. To pin or share them, use _How to persist changes_ to copy a ready-made `tui.json` snippet.

Key capture ignores modifier-only presses, treats `Esc` as cancel, and accepts combinations such as `alt+t`, `ctrl+shift+tab`, `f2`, or `pagedown`.

## Configuration

All options live in the plugin entry in `tui.json`:

```json
{
  "plugin": [
    [
      "opencode-hotkeys",
      {
        "enabled": true,
        "preset": "native",
        "debug": false,
        "bindings": {
          "hotkeys.new": "alt+n",
          "hotkeys.picker": ["alt+o", "alt+p"],
          "hotkeys.doctor": false
        }
      }
    ]
  ]
}
```

| Option     | Type                               | Default    | Description                                                   |
| ---------- | ---------------------------------- | ---------- | ------------------------------------------------------------- |
| `enabled`  | boolean                            | `true`     | Keep the plugin installed but disable every shortcut.         |
| `preset`   | `"native" \| "browser" \| "notes"` | `"native"` | Base shortcut preset.                                         |
| `bindings` | object                             | `{}`       | Per-action overrides.                                         |
| `debug`    | boolean                            | `false`    | Write diagnostic markers to OpenCode's local key-value store. |

### Binding values

```jsonc
{
  "hotkeys.new": "alt+t", // one key
  "hotkeys.picker": ["alt+o", "alt+p"], // several keys
  "hotkeys.doctor": false, // remove the shortcut entirely
}
```

Comma-separated strings are accepted too: `"alt+o,alt+p"`. Key names are normalized, so `Alt+T`, `alt-t`, and `Option+T` resolve to the same binding.

Available action ids:

```
hotkeys.new          hotkeys.picker       hotkeys.next
hotkeys.prev         hotkeys.switch.1-9   hotkeys.studio
hotkeys.help         hotkeys.doctor
```

The JSON Schema is published at [`schema.json`](./schema.json).

## How quick slots work

Quick slots are intentionally simple:

1. Pinned sessions first, in pin order.
2. Then recent sessions, newest first.
3. Missing slots report a short toast instead of failing silently.

The picker lists the same sessions with titles, directories, and relative update times. Selecting an entry navigates to it.

## Compatibility

| OpenCode | Adapter              | Status                                                        |
| -------- | -------------------- | ------------------------------------------------------------- |
| `1.x`    | `src/adapters/v1.ts` | Tested with `1.18.23`                                         |
| `2.x`    | `src/adapters/v2.ts` | Preview adapter; core actions work, Studio is read-only in v2 |

The package ships raw TypeScript for the TUI entry, matching how OpenCode loads local TUI plugins. There are no runtime imports from `@opencode-ai/plugin` or `@opentui/*`; those packages are development-time types only.

## Troubleshooting

### The desktop app does not show the shortcuts

The Electron desktop app does not load TUI plugins yet. Run `opencode` in a terminal instead; `tui.json` and this plugin apply to the terminal TUI.

### Nothing happens after installing

1. Confirm the entry is in `tui.json`, not `opencode.json`.
2. Restart OpenCode completely.
3. Press `Alt+I` or type `/hotkeys`.
4. Make sure you are not running `opencode --pure`, which disables external plugins.
5. Set `"debug": true` and inspect the `opencode-hotkeys:register` / `opencode-hotkeys:registered` markers in OpenCode's local key-value state.

### `Alt` shortcuts do not arrive

- On macOS, enable **Option as Meta** (iTerm2: _Profiles → Keys → Left/Right Option key → Esc+_).
- In tmux, check whether the prefix or terminal settings consume `Alt`.
- Try a function key or `ctrl+shift+...` combination in Hotkey Studio.

### `Ctrl+Tab` or `Ctrl+1…9` do nothing

Many terminals reserve these combinations for tab switching. Prefer the native preset or rebind those actions to `Alt` combinations.

### A shortcut conflicts with OpenCode

Open Hotkey Studio: conflicts with native actions are shown before a change is applied. In the configuration file, prefer the native preset and override one action at a time.

### The Studio reopened with my old shortcut after restart

That is intentional: Studio changes are persisted in OpenCode's local state. Use _Reset to preset_ or _Reset all overrides_ to remove them. An explicit `bindings` value in `tui.json` always wins over a stored Studio change.

## Development

```bash
bun install
bun run check        # typecheck + tests
bun run format:check
npm pack --dry-run   # inspect the published package
```

The test suite covers key normalization, presets, conflict detection, session ordering, config parsing, the installer, and preset file parity.

To try the plugin from a local checkout, point `OPENCODE_TUI_CONFIG` at a test config and list the absolute path to `tui.ts` in the `plugin` array.

## Roadmap

- Full Studio parity in the v2 adapter.
- Close/reopen and pin tabs from the keyboard.
- A visual tab bar.
- Per-project presets.
- `fa` locale for Studio and help dialogs.

## Contributing

Issues and pull requests are welcome. Please run `bun run check` before opening a PR and include the OpenCode version and terminal you tested with.

## License

[MIT](./LICENSE) © 2026 Nariman Khaleghi

---

<p align="center">
  <sub>Not affiliated with OpenCode, Obsidian, Google, or Chrome. “Obsidian-style” describes the interaction pattern only.</sub>
</p>
