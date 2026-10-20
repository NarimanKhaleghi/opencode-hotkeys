<p align="center">
  <a href="https://github.com/NarimanKhaleghi/opencode-hotkeys">
    <img src="assets/banner.svg" alt="Hotkeys for OpenCode" width="100%">
  </a>
</p>

<div dir="rtl" align="right">

<p align="center">
  <strong>سوییچ سریع بین sessionها به سبک مرورگر و استودیوی هات‌کی به سبک Obsidian برای OpenCode.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/opencode-hotkeys"><img src="https://img.shields.io/npm/v/opencode-hotkeys?color=f5a524" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/opencode-hotkeys"><img src="https://img.shields.io/npm/dm/opencode-hotkeys" alt="npm downloads"></a>
  <a href="https://github.com/NarimanKhaleghi/opencode-hotkeys/actions/workflows/ci.yml"><img src="https://github.com/NarimanKhaleghi/opencode-hotkeys/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/opencode-hotkeys?color=blue" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/OpenCode-1.x%20%7C%202.x-111827" alt="OpenCode 1.x and 2.x">
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="#نصب">نصب</a> ·
  <a href="#کلیدهای-میانبر">کلیدهای میانبر</a> ·
  <a href="#hotkey-studio">Hotkey Studio</a> ·
  <a href="#تنظیمات">تنظیمات</a> ·
  <a href="#عیب‌یابی">عیب‌یابی</a>
</p>

---

**Hotkeys for OpenCode** همان میانبرهایی را به TUI اضافه می‌کند که در مرورگر و ادیتور استفاده می‌کنید:

- `Alt+T` یک session جدید می‌سازد.
- `Alt+1…9` بین sessionها جابه‌جا می‌شود.
- `Alt+PageUp` / `Alt+PageDown` بین sessionها چرخش می‌کند.
- `Alt+O` یک session picker قابل جست‌وجو باز می‌کند.
- `Alt+K` استودیوی **Hotkey Studio** را باز می‌کند.
- `Alt+I` preset فعال و همهٔ میانبرها را نشان می‌دهد.

همه‌چیز محلی است: بدون درخواست شبکه، بدون telemetry و بدون وابستگی runtime به پکیج‌های OpenCode.

<p align="center">
  <img src="assets/hotkey-studio.svg" alt="Hotkey Studio" width="86%">
</p>

## چرا این پلاگین؟

OpenCode برای زنده نگه‌داشتن چندین session عالی است، اما جابه‌جایی بین آن‌ها با کیبورد هنوز محدود است. این پلاگین یک لایهٔ کوچک و قابل پیش‌بینی اضافه می‌کند:

- **اولویت با میانبرهای بومی.** preset پیش‌فرض از تمام کلیدهایی که OpenCode قبلاً استفاده می‌کند دوری می‌کند.
- **بدون fork و patch.** یک پلاگین معمولی TUI است.
- **همه‌چیز قابل تغییر.** Hotkey Studio کلید بعدی را می‌گیرد و تداخل‌ها را بررسی می‌کند.
- **presetها، نه قفل‌شدن.** یکی از `native`، `browser` یا `notes` را انتخاب کنید و فقط موارد لازم را override کنید.
- **آگاه از session.** quick slotها ابتدا sessionهای pin‌شده و سپس sessionهای اخیر را ترجیح می‌دهند.

## نصب

### ۱. افزودن پلاگین به `tui.json`

فایل config سراسری TUI را باز کنید (معمولاً `~/.config/opencode/tui.json`) و پلاگین را اضافه کنید:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["opencode-hotkeys", { "preset": "native" }]]
}
```

OpenCode را دوباره اجرا کنید و با `Alt+I` بررسی کنید که پلاگین لود شده باشد.

> از `tui.json` استفاده کنید، نه `opencode.json`. پلاگین‌های TUI از config مربوط به TUI لود می‌شوند.

### ۲. یا اجرای installer

```bash
npx opencode-hotkeys
# یا
bunx opencode-hotkeys
```

installer فایل `tui.json` سراسری را ویرایش می‌کند و commentها و formatting را حفظ می‌کند:

```bash
npx opencode-hotkeys --preset browser
npx opencode-hotkeys --bind hotkeys.new=alt+n
npx opencode-hotkeys --debug
npx opencode-hotkeys --uninstall
```

با `--config <path>` فایل دیگری را هدف بگیرید و با `--print` نتیجه را بدون نوشتن ببینید.

### ۳. یا نصب از CLI خود OpenCode

```bash
opencode plugin opencode-hotkeys --global
```

اگر build شما پلاگین‌های TUI را جدا نگه می‌دارد، ورودی `tui.json` بالا را هم اضافه کنید.

## کلیدهای میانبر

### Native first (پیش‌فرض)

| میانبر         | عملکرد                 |
| -------------- | ---------------------- |
| `Alt+T`        | session جدید           |
| `Alt+O`        | session picker         |
| `Alt+PageDown` | session بعدی           |
| `Alt+PageUp`   | session قبلی           |
| `Alt+1…9`      | رفتن به quick slot 1…9 |
| `Alt+K`        | Hotkey Studio          |
| `Alt+I`        | راهنمای هات‌کی‌ها      |

preset بومی عمداً از میانبرهایی که OpenCode دارد دوری می‌کند. امن‌ترین انتخاب برای نصب اول است.

### Browser

| میانبر           | عملکرد                 |
| ---------------- | ---------------------- |
| `Ctrl+T`         | session جدید           |
| `Ctrl+L`         | session picker         |
| `Ctrl+Tab`       | session بعدی           |
| `Ctrl+Shift+Tab` | session قبلی           |
| `Ctrl+1…9`       | رفتن به quick slot 1…9 |
| `Alt+K`          | Hotkey Studio          |
| `Alt+I`          | راهنمای هات‌کی‌ها      |

برخی ترمینال‌ها `Ctrl+Tab` و `Ctrl+1…9` را قبل از OpenCode می‌گیرند. در macOS اگر میانبرهای `Alt` نمی‌رسند، گزینهٔ **Option as Meta** را فعال کنید.

### Notes

| میانبر           | عملکرد                 |
| ---------------- | ---------------------- |
| `Ctrl+N`         | session جدید           |
| `Ctrl+O`         | session picker         |
| `Ctrl+Tab`       | session بعدی           |
| `Ctrl+Shift+Tab` | session قبلی           |
| `Alt+1…9`        | رفتن به quick slot 1…9 |
| `Alt+K`          | Hotkey Studio          |
| `Alt+I`          | راهنمای هات‌کی‌ها      |

### اسلش‌کامندها

| فرمان       | باز می‌کند        |
| ----------- | ----------------- |
| `/keys`     | Hotkey Studio     |
| `/hotkeys`  | راهنمای هات‌کی‌ها |
| `/sessions` | session picker    |

## Hotkey Studio

با `Alt+K` یا تایپ `/keys` باز می‌شود.

- **جست‌وجو** بین همهٔ actionها.
- **مشاهدهٔ** binding فعلی و توضیح هر action.
- **تغییر binding** با انتخاب _Rebind shortcut_ و فشردن ترکیب جدید.
- **پاک‌کردن** binding بدون جایگزین.
- **Reset** یک action یا همهٔ overrideها به preset انتخابی.
- **تغییر preset** بدون ویرایش JSON.
- **دیدن تداخل‌ها** با actionهای دیگر و میانبرهای بومی OpenCode قبل از اعمال.

تغییرات Studio فوراً اعمال می‌شوند و در state محلی OpenCode ذخیره و بعد از restart بازیابی می‌شوند. برای pin کردن یا به‌اشتراک‌گذاری، از _How to persist changes_ یک snippet آمادهٔ `tui.json` بگیرید.

گرفتن کلید، فشارهای فقط-modifier را نادیده می‌گیرد، `Esc` را cancel می‌داند و ترکیب‌هایی مثل `alt+t`، `ctrl+shift+tab`، `f2` یا `pagedown` را می‌پذیرد.

## تنظیمات

همهٔ گزینه‌ها در ورودی پلاگین در `tui.json` قرار می‌گیرند:

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

| گزینه      | نوع                                | پیش‌فرض    | توضیح                                                    |
| ---------- | ---------------------------------- | ---------- | -------------------------------------------------------- |
| `enabled`  | boolean                            | `true`     | پلاگین نصب بماند ولی همهٔ میانبرها غیرفعال شوند.         |
| `preset`   | `"native" \| "browser" \| "notes"` | `"native"` | preset پایه.                                             |
| `bindings` | object                             | `{}`       | override برای هر action.                                 |
| `debug`    | boolean                            | `false`    | نوشتن markerهای تشخیصی در key-value store محلی OpenCode. |

### مقدار binding

```jsonc
{
  "hotkeys.new": "alt+t", // یک کلید
  "hotkeys.picker": ["alt+o", "alt+p"], // چند کلید
  "hotkeys.doctor": false, // حذف کامل میانبر
}
```

رشتهٔ جداشده با کاما هم پذیرفته می‌شود: `"alt+o,alt+p"`. نام کلیدها نرمال‌سازی می‌شوند؛ `Alt+T`، `alt-t` و `Option+T` یک نتیجه دارند.

شناسه‌های action:

```
hotkeys.new          hotkeys.picker       hotkeys.next
hotkeys.prev         hotkeys.switch.1-9   hotkeys.studio
hotkeys.help         hotkeys.doctor
```

JSON Schema در [`schema.json`](./schema.json) منتشر می‌شود.

## quick slotها چطور کار می‌کنند؟

منطق عمداً ساده است:

1. ابتدا sessionهای pin‌شده، به ترتیب pin.
2. سپس sessionهای اخیر، جدیدترین اول.
3. اگر slot خالی باشد، یک toast کوتاه نمایش داده می‌شود.

picker همان sessionها را با title، directory و زمان نسبی update نشان می‌دهد. انتخاب هر مورد شما را به آن session می‌برد.

## سازگاری

| OpenCode | Adapter              | وضعیت                                                                       |
| -------- | -------------------- | --------------------------------------------------------------------------- |
| `1.x`    | `src/adapters/v1.ts` | تست‌شده با `1.18.23`                                                        |
| `2.x`    | `src/adapters/v2.ts` | adapter پیش‌نمایش؛ actionهای اصلی کار می‌کنند، Studio در v2 فقط خواندنی است |

پکیج entry مربوط به TUI را به‌صورت TypeScript خام منتشر می‌کند، همان روشی که OpenCode پلاگین‌های TUI محلی را لود می‌کند. هیچ import runtime از `@opencode-ai/plugin` یا `@opentui/*` وجود ندارد؛ آن پکیج‌ها فقط type در زمان توسعه هستند.

## عیب‌یابی

### بعد از نصب هیچ اتفاقی نمی‌افتد

1. مطمئن شوید ورودی در `tui.json` است، نه `opencode.json`.
2. OpenCode را کامل restart کنید.
3. `Alt+I` را بزنید یا `/hotkeys` را تایپ کنید.
4. مطمئن شوید با `opencode --pure` اجرا نمی‌کنید؛ این حالت پلاگین‌های خارجی را غیرفعال می‌کند.
5. `"debug": true` را تنظیم کنید و markerهای `opencode-hotkeys:register` / `opencode-hotkeys:registered` را در state محلی OpenCode بررسی کنید.

### میانبرهای `Alt` نمی‌رسند

- در macOS گزینهٔ **Option as Meta** را فعال کنید (iTerm2: _Profiles → Keys → Left/Right Option key → Esc+_).
- در tmux بررسی کنید prefix یا تنظیمات ترمینال `Alt` را نمی‌گیرند.
- در Hotkey Studio یک function key یا ترکیب `ctrl+shift+...` امتحان کنید.

### `Ctrl+Tab` یا `Ctrl+1…9` کاری نمی‌کنند

بسیاری از ترمینال‌ها این ترکیب‌ها را برای tab switching رزرو می‌کنند. preset بومی را ترجیح دهید یا این actionها را به ترکیب‌های `Alt` تغییر دهید.

### میانبر با OpenCode تداخل دارد

Hotkey Studio را باز کنید: تداخل با actionهای بومی قبل از اعمال نمایش داده می‌شود. در فایل config، preset بومی را ترجیح دهید و هر بار فقط یک action را override کنید.

### بعد از restart، Studio میانبر قدیمی را برگرداند

این رفتار عمدی است: تغییرات Studio در state محلی OpenCode ذخیره می‌شوند. با _Reset to preset_ یا _Reset all overrides_ آن‌ها را حذف کنید. مقدار صریح `bindings` در `tui.json` همیشه بر تغییر ذخیره‌شدهٔ Studio اولویت دارد.

## توسعه

```bash
bun install
bun run check        # typecheck + tests
bun run format:check
npm pack --dry-run   # بررسی محتوای پکیج
```

تست‌ها key normalization، presetها، تشخیص تداخل، ترتیب sessionها، config، installer و هم‌خوانی فایل‌های preset را پوشش می‌دهند.

برای تست از checkout محلی، `OPENCODE_TUI_CONFIG` را به یک config آزمایشی اشاره دهید و مسیر absolute `tui.ts` را در آرایهٔ `plugin` بگذارید.

## نقشهٔ راه

- تطبیق کامل Studio در adapter نسخهٔ ۲.
- بستن/بازکردن و pin کردن tabها با کیبورد.
- tab bar بصری.
- preset به‌ازای هر پروژه.
- locale فارسی برای Studio و دیالوگ‌های راهنما.

## مشارکت

Issue و pull request خوش‌آمد است. قبل از PR دستور `bun run check` را اجرا کنید و نسخهٔ OpenCode و ترمینال تست‌شده را بنویسید.

## مجوز

[MIT](./LICENSE) © 2026 Nariman Khaleghi

---

<p align="center">
  <sub>وابسته به OpenCode، Obsidian، Google یا Chrome نیست. «Obsidian-style» فقط الگوی تعامل را توصیف می‌کند.</sub>
</p>

</div>
