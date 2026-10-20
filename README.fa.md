<p align="center">
  <a href="https://github.com/NarimanKhaleghi/opencode-hotkeys">
    <img src="assets/banner.svg" alt="Hotkeys for OpenCode" width="100%">
  </a>
</p>

<div dir="rtl" align="right">

<p align="center">
  <strong>میان‌برهای مرورگری برای OpenCode Desktop؛ با کلیدهای بومی، یک فرمان و بدون patch.</strong>
</p>

<p align="center">
  <a href="https://github.com/NarimanKhaleghi/opencode-hotkeys/actions/workflows/ci.yml"><img src="https://github.com/NarimanKhaleghi/opencode-hotkeys/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-1f35ff" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/OpenCode%20Desktop-1.19%2B-111827" alt="OpenCode Desktop 1.19+">
  <img src="https://img.shields.io/badge/TUI-1.x%20%7C%202.x-111827" alt="OpenCode TUI 1.x and 2.x">
  <a href="https://narimankhaleghi.github.io/opencode-hotkeys/fa/"><img src="https://img.shields.io/badge/docs-EN%20%7C%20%D9%81%D8%A7%D8%B1%D8%B3%DB%8C-1f35ff" alt="Documentation"></a>
</p>

<p align="center">
  <a href="./README.md">English</a> ·
  <a href="https://narimankhaleghi.github.io/opencode-hotkeys/fa/">مستندات</a> ·
  <a href="#شروع-سریع-دسکتاپ">نصب دسکتاپ</a> ·
  <a href="#نقشهٔ-کلیدهای-دسکتاپ">نقشهٔ کلیدها</a> ·
  <a href="#نسخهٔ-ترمینال-tui">نسخهٔ TUI</a> ·
  <a href="#عیب‌یابی">عیب‌یابی</a>
</p>

---

**Hotkeys for OpenCode** همان لایهٔ کلیدی را به OpenCode Desktop می‌دهد که در مرورگر دارید: تب جدید، جابه‌جایی شماره‌ای بین تب‌ها، چرخش تب، جست‌وجوی سریع و تنظیمات، بدون برداشتن دست از کیبورد. نصب‌کنندهٔ دسکتاپ فقط تنظیمات کلید خود اپ را می‌نویسد؛ نه patch می‌کند، نه اپ را wrap می‌کند و نه فرایندی در پس‌زمینه نگه می‌دارد.

این مخزن یک نسخهٔ جداگانه برای ترمینال هم دارد: با presetها، quick slotهای نشست و **Hotkey Studio**. هر دو سطح پایین‌تر مستند شده‌اند.

<p align="center">
  <img src="assets/hotkey-studio.svg" alt="Hotkey Studio در OpenCode TUI" width="86%">
</p>

## چه چیزی می‌گیرید؟

| سطح                      | اپ دسکتاپ                                      | ترمینال TUI                              |
| ------------------------ | ---------------------------------------------- | ---------------------------------------- |
| تب جدید                  | `Alt+Enter`، `Alt+T`، `Mod+T`، `Mod+N`         | `Alt+T`                                  |
| جابه‌جایی بین تب‌های باز | `Alt+1…9`، `Mod+1…9`                           | `Alt+1…9` برای quick slotها              |
| چرخش تب                  | `Alt+PageUp/Down`، `Alt+Home/End`              | `Alt+PageUp/Down` بین نشست‌ها            |
| جست‌وجو                  | `Alt+/`، `Alt+O`، `Mod+P`                      | `Alt+O` برای session picker              |
| تنظیمات                  | `Alt+.`، `Alt+K`، `Mod+,`                      | `Alt+K` برای Hotkey Studio               |
| تغییر از رابط            | Settings → Shortcuts بومی اپ                   | استودیو: ثبت کلید، بررسی تداخل، بازنشانی |
| Presetها                 | پیش‌فرض‌های نصب‌شده + پیش‌فرض‌های خود OpenCode | `native`، `browser`، `notes`             |
| ماندگاری                 | فایل تنظیمات خود OpenCode Desktop              | `tui.json` + state محلی OpenCode         |
| محدودهٔ اثر              | وقتی پنجرهٔ دسکتاپ فعال است                    | وقتی ترمینال فعال است                    |

`Mod` در Linux و Windows یعنی `Ctrl` و در macOS یعنی `Cmd`.

## شروع سریع دسکتاپ

### پیش‌نیازها

- OpenCode Desktop نسخهٔ **1.19 یا جدیدتر**. تست‌شده با `1.19.3` روی Linux/Wayland.
- Node.js نسخهٔ **20 یا جدیدتر** برای نصب‌کننده.
- اپ دسکتاپ حداقل یک‌بار باز شده باشد تا فایل تنظیماتش ساخته شود.

### نصب با یک فرمان

Linux و macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/NarimanKhaleghi/opencode-hotkeys/main/install-desktop.sh | sh
```

اگر می‌خواهید قبل از اجرا اسکریپت را ببینید:

```bash
curl -fsSL https://raw.githubusercontent.com/NarimanKhaleghi/opencode-hotkeys/main/install-desktop.sh -o install-desktop.sh
sh install-desktop.sh
```

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/NarimanKhaleghi/opencode-hotkeys/main/install-desktop.ps1 -OutFile "$env:TEMP\opencode-hotkeys.ps1"
powershell -ExecutionPolicy Bypass -File "$env:TEMP\opencode-hotkeys.ps1"
```

### نصب از clone

```bash
git clone https://github.com/NarimanKhaleghi/opencode-hotkeys.git
node opencode-hotkeys/desktop/install.mjs
```

نصب‌کنندهٔ دسکتاپ هیچ وابستگی npm ندارد؛ clone کافی است.

### اعمال تغییر

OpenCode Desktop را کامل ببندید و دوباره باز کنید. سپس با `Alt+Enter` تب جدید بسازید و با `Alt+1` به تب اول برگردید.

نصب‌کننده هیچ‌وقت اپ را نمی‌بندد و restart نمی‌کند. اپِ در حال اجرا کلیدها را فقط هنگام شروع می‌خواند.

### بررسی، مشاهده و برگرداندن

```bash
node desktop/install.mjs --check
node desktop/install.mjs --print
node desktop/install.mjs --dry-run
node desktop/install.mjs --uninstall
node desktop/install.mjs --restore latest
```

`--uninstall` فقط کلیدهایی را حذف می‌کند که همین ابزار نصب کرده است. اگر یکی را خودتان تغییر داده باشید، نسخهٔ شما را نگه می‌دارد و می‌گوید کدام‌ها را نگه داشته. `--restore latest` جدیدترین پشتیبان کنار `default.dat` را برمی‌گرداند.

## نقشهٔ کلیدهای دسکتاپ

میان‌برهای اصلی از کلیدهایی استفاده می‌کنند که نامشان در چیدمان فارسی، عربی یا سایر چیدمان‌های غیرلاتین تغییر نمی‌کند. نسخهٔ حروف لاتین و پیش‌فرض‌های اصلی OpenCode هم به‌عنوان گزینه‌های اضافی حفظ شده‌اند.

| کار                         | اصلی              | گزینه‌های دیگر               |
| --------------------------- | ----------------- | ---------------------------- |
| تب جدید (نشست draft)        | `Alt+Enter`       | `Alt+T`، `Mod+T`، `Mod+N`    |
| رفتن به تب ۱ تا ۹           | `Alt+1…9`         | `Mod+1…9`                    |
| تب قبلی                     | `Alt+PageUp`      | `Alt+Home`، `Ctrl+Shift+Tab` |
| تب بعدی                     | `Alt+PageDown`    | `Alt+End`، `Ctrl+Tab`        |
| جست‌وجوی فایل، فرمان و نشست | `Alt+/`           | `Alt+O`، `Mod+P`             |
| باز کردن تنظیمات            | `Alt+.`           | `Alt+K`، `Mod+,`             |
| بستن تب فعلی                | `Mod+W`           | پیش‌فرض خود اپ               |
| بازگرداندن تب بسته‌شده      | `Mod+Shift+T`     | پیش‌فرض خود اپ               |
| نشست قبلی / بعدی            | `Alt+↑` / `Alt+↓` | پیش‌فرض خود اپ               |

**تب‌ها، نه تاریخچه.** `Alt+1…9` بین تب‌هایی جابه‌جا می‌شود که الان باز هستند. برای رفتن به هر نشستی، حتی نشستی که تب باز ندارد، از پالت جست‌وجو (`Alt+/`) استفاده کنید و نشست را انتخاب کنید.

**چرا دو دسته کلید؟** تطبیق‌دهندهٔ کلید دسکتاپ کاراکتری را مقایسه می‌کند که کلید تولید می‌کند، نه موقعیت فیزیکی آن را. در چیدمان `ir+winkeys`، ترکیب `Alt+T` یک کاراکتر فارسی تولید می‌کند و `alt+t` هرگز match نمی‌شود. اعداد، کلیدهای ناوبری، `/` و `.` پایدار می‌مانند؛ برای همین نصب‌کننده آن‌ها را اول می‌گذارد و نسخهٔ لاتین را برای چیدمان‌های لاتین نگه می‌دارد.

## نصب‌کنندهٔ دسکتاپ چه می‌کند؟

1. `default.dat` را در مسیر استاندارد تنظیمات OpenCode Desktop برای سیستم‌عامل پیدا می‌کند.
2. JSON بیرونی و مقدار `settings.v3` را می‌خواند.
3. ۱۴ ورودی کلید را داخل آبجکت `keybinds` موجود ادغام می‌کند.
4. یک پشتیبان زمان‌دار کنار فایل تنظیمات می‌سازد.
5. تنظیمات جدید را به‌صورت atomic می‌نویسد و بقیهٔ ترجیحات را دست‌نخورده می‌گذارد.

مسیر تنظیمات:

| سیستم‌عامل | مسیر پیش‌فرض                                                    |
| ---------- | --------------------------------------------------------------- |
| Linux      | `~/.config/ai.opencode.desktop/default.dat`                     |
| macOS      | `~/Library/Application Support/ai.opencode.desktop/default.dat` |
| Windows    | `%APPDATA%\ai.opencode.desktop\default.dat`                     |

نصب‌کننده نام‌های `OpenCode` و `opencode-desktop` را هم بررسی می‌کند و متغیر `OPENCODE_DESKTOP_CONFIG` را می‌شناسد.

گزینه‌های نصب‌کننده:

| گزینه               | کار                                                       |
| ------------------- | --------------------------------------------------------- |
| `-c, --config PATH` | استفاده از یک `default.dat` مشخص                          |
| `--check`           | خروج با کد `0` فقط وقتی همهٔ کلیدهای مدیریت‌شده نصب باشند |
| `--print`           | چاپ JSON کلیدهای مدیریت‌شده                               |
| `--dry-run`         | نمایش تغییرات بدون نوشتن                                  |
| `--uninstall`       | حذف فقط کلیدهای مدیریت‌شدهٔ تغییرنکرده                    |
| `--restore PATH`    | بازگرداندن یک پشتیبان مشخص                                |
| `--restore latest`  | بازگرداندن جدیدترین پشتیبان کنار فایل تنظیمات             |
| `-h, --help`        | نمایش راهنما                                              |
| `-v, --version`     | نمایش نسخهٔ نصب‌کننده                                     |

### نصب دستی

در OpenCode Desktop به **Settings → Shortcuts** بروید و فرمان‌های قابل‌مشاهده را دستی تنظیم کنید. بعضی فرمان‌های تب داخلی هستند؛ بنابراین نصب‌کننده تنها راه کامل و بدون ویرایش دستی است.

برای ویرایش دستی فایل، اول اپ را ببندید. داخل `default.dat`، مقدار `settings.v3` یک رشتهٔ JSON است. آن را parse کنید و این ورودی‌ها را به آبجکت `keybinds` اضافه کنید:

```json
{
  "tab.new": "alt+enter,alt+t,mod+t,mod+n",
  "tab.1": "alt+1,mod+1",
  "tab.2": "alt+2,mod+2",
  "tab.3": "alt+3,mod+3",
  "tab.4": "alt+4,mod+4",
  "tab.5": "alt+5,mod+5",
  "tab.6": "alt+6,mod+6",
  "tab.7": "alt+7,mod+7",
  "tab.8": "alt+8,mod+8",
  "tab.9": "alt+9,mod+9",
  "tab.prev": "alt+pageup,alt+home,mod+option+arrowleft,ctrl+shift+tab",
  "tab.next": "alt+pagedown,alt+end,mod+option+arrowright,ctrl+tab",
  "file.open": "alt+/,alt+o,mod+p",
  "settings.open": "alt+.,alt+k,mod+comma"
}
```

در Linux و Windows، `mod` یعنی `Ctrl`. در macOS، `mod` یعنی `Cmd`. اپ دسکتاپ برای یک کار، چند گزینهٔ جداشده با کاما را می‌پذیرد.

## محدودیت‌های دسکتاپ

- میان‌برها وقتی کار می‌کنند که OpenCode Desktop فعال باشد. این یک daemon میان‌بر سراسری سیستم‌عامل نیست.
- اپ دسکتاپ پلاگین‌های TUI را لود نمی‌کند؛ پس Hotkey Studio در آن در دسترس نیست. برای شخصی‌سازی بیشتر از Settings → Shortcuts بومی استفاده کنید.
- `Alt+1…9` فقط تب‌ها را عوض می‌کند، نه همهٔ نشست‌ها. برای جست‌وجوی همهٔ نشست‌ها از `Alt+/` استفاده کنید.
- فرمان‌های تب بخشی از کاتالوگ داخلی OpenCode Desktop هستند. تغییر نام آن‌ها در نسخه‌های بعدی می‌تواند یک کلید را از کار بیندازد؛ `--check` این وضعیت را گزارش می‌کند.
- نصب‌کننده فقط تنظیمات محلی را ویرایش می‌کند. هیچ telemetry، درخواست شبکه یا فرایند پس‌زمینه‌ای وجود ندارد.

## نسخهٔ ترمینال (TUI)

پلاگین ترمینال همچنان نسخهٔ کامل‌تر است: presetها، quick slotهای نشست، `/keys` و Hotkey Studio.

### نصب نسخهٔ TUI

از GitHub:

```bash
git clone https://github.com/NarimanKhaleghi/opencode-hotkeys.git ~/.local/share/opencode-hotkeys
realpath ~/.local/share/opencode-hotkeys/tui.ts
```

مسیر absolute چاپ‌شده را به `~/.config/opencode/tui.json` اضافه کنید:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["/absolute/path/to/opencode-hotkeys/tui.ts", { "preset": "native" }]]
}
```

اپ ترمینالی OpenCode را دوباره اجرا کنید و با `Alt+I` بررسی کنید که پلاگین لود شده باشد. از `tui.json` استفاده کنید، نه `opencode.json`.

یا نصب‌کنندهٔ TUI را از clone اجرا کنید:

```bash
cd ~/.local/share/opencode-hotkeys
bun install
node bin/opencode-hotkeys.mjs --preset native
```

نصب‌کننده commentها و formatting را حفظ می‌کند:

```bash
node bin/opencode-hotkeys.mjs --preset browser
node bin/opencode-hotkeys.mjs --bind hotkeys.new=alt+n
node bin/opencode-hotkeys.mjs --debug
node bin/opencode-hotkeys.mjs --uninstall
```

<details>
<summary><strong>مرجع کامل TUI: presetها، استودیو، تنظیمات و عیب‌یابی</strong></summary>

#### Preset بومی‌محور (پیش‌فرض)

| میان‌بر        | کار                       |
| -------------- | ------------------------- |
| `Alt+T`        | نشست جدید                 |
| `Alt+O`        | انتخابگر نشست             |
| `Alt+PageDown` | نشست بعدی                 |
| `Alt+PageUp`   | نشست قبلی                 |
| `Alt+1…9`      | رفتن به quick slot ۱ تا ۹ |
| `Alt+K`        | Hotkey Studio             |
| `Alt+I`        | راهنمای کلیدها            |

#### Preset مرورگر

| میان‌بر          | کار                       |
| ---------------- | ------------------------- |
| `Ctrl+T`         | نشست جدید                 |
| `Ctrl+L`         | انتخابگر نشست             |
| `Ctrl+Tab`       | نشست بعدی                 |
| `Ctrl+Shift+Tab` | نشست قبلی                 |
| `Ctrl+1…9`       | رفتن به quick slot ۱ تا ۹ |
| `Alt+K`          | Hotkey Studio             |
| `Alt+I`          | راهنمای کلیدها            |

#### Preset یادداشت

| میان‌بر          | کار                       |
| ---------------- | ------------------------- |
| `Ctrl+N`         | نشست جدید                 |
| `Ctrl+O`         | انتخابگر نشست             |
| `Ctrl+Tab`       | نشست بعدی                 |
| `Ctrl+Shift+Tab` | نشست قبلی                 |
| `Alt+1…9`        | رفتن به quick slot ۱ تا ۹ |
| `Alt+K`          | Hotkey Studio             |
| `Alt+I`          | راهنمای کلیدها            |

#### فرمان‌های slash

| فرمان       | باز می‌کند     |
| ----------- | -------------- |
| `/keys`     | Hotkey Studio  |
| `/hotkeys`  | راهنمای کلیدها |
| `/sessions` | انتخابگر نشست  |

#### Hotkey Studio

`Alt+K` را بزنید یا `/keys` را تایپ کنید.

- جست‌وجوی همهٔ کارها بر اساس عنوان.
- مشاهدهٔ کلید فعلی و توضیح.
- تغییر کلید با انتخاب _Rebind shortcut_ و فشردن ترکیب جدید.
- پاک کردن کلید بدون جایگزین.
- بازنشانی یک کار یا همهٔ overrideها به preset انتخاب‌شده.
- تغییر preset بدون ویرایش JSON.
- مشاهدهٔ تداخل با کارهای دیگر پلاگین و میان‌برهای بومی OpenCode قبل از اعمال.
- کپی یک snippet آمادهٔ `tui.json` از _How to persist changes_.

تغییرات استودیو فوراً اعمال می‌شوند، در state محلی OpenCode ذخیره می‌شوند و بعد از restart بازمی‌گردند. مقدار صریح `bindings` در `tui.json` همیشه بر تغییر ذخیره‌شدهٔ استودیو اولویت دارد.

#### تنظیمات

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

| گزینه      | نوع                                | پیش‌فرض    | توضیح                                              |
| ---------- | ---------------------------------- | ---------- | -------------------------------------------------- |
| `enabled`  | boolean                            | `true`     | پلاگین نصب بماند اما همهٔ میان‌برها غیرفعال شوند.  |
| `preset`   | `"native" \| "browser" \| "notes"` | `"native"` | preset پایه.                                       |
| `bindings` | object                             | `{}`       | override هر کار.                                   |
| `debug`    | boolean                            | `false`    | نوشتن markerهای تشخیصی در key-value محلی OpenCode. |

شناسهٔ کارهای موجود:

```text
hotkeys.new          hotkeys.picker       hotkeys.next
hotkeys.prev         hotkeys.switch.1-9   hotkeys.studio
hotkeys.help         hotkeys.doctor
```

رشته‌های جداشده با کاما هم پذیرفته می‌شوند: `"alt+o,alt+p"`. نام کلیدها نرمال می‌شوند؛ `Alt+T`، `alt-t` و `Option+T` یک نتیجه می‌دهند. JSON Schema در [`schema.json`](./schema.json) است.

#### سازگاری TUI

| OpenCode | Adapter              | وضعیت                                                                     |
| -------- | -------------------- | ------------------------------------------------------------------------- |
| `1.x`    | `src/adapters/v1.ts` | تست‌شده با `1.18.23`                                                      |
| `2.x`    | `src/adapters/v2.ts` | adapter پیش‌نمایش؛ کارهای اصلی کار می‌کنند، استودیو در v2 فقط خواندنی است |

پکیج برای ورودی TUI، TypeScript خام ارائه می‌دهد؛ همان روشی که OpenCode پلاگین‌های محلی TUI را لود می‌کند. هیچ import زمان اجرا از `@opencode-ai/plugin` یا `@opentui/*` وجود ندارد؛ آن پکیج‌ها فقط typeهای زمان توسعه هستند.

</details>

## عیب‌یابی

### در دسکتاپ فقط `Alt+1…9` کار می‌کند

چیدمان کیبورد شما برای کلیدهای حرفی کاراکتر غیرلاتین تولید می‌کند. برای تب جدید `Alt+Enter`، برای چرخش `Alt+PageUp/Down`، برای جست‌وجو `Alt+/` و برای تنظیمات `Alt+.` را بزنید. این‌ها همان کلیدهای پایدارند که نصب‌کننده اول می‌گذارد. `Alt+T`، `Alt+O` و `Alt+K` برای چیدمان‌های لاتین باقی مانده‌اند.

### یک میان‌بر دسکتاپ کاری نمی‌کند

1. OpenCode Desktop را کامل ببندید و دوباره باز کنید.
2. با `node desktop/install.mjs --check` مطمئن شوید تنظیمات حاضرند.
3. مطمئن شوید پنجرهٔ دسکتاپ فعال است. این‌ها میان‌بر سراسری سیستم نیستند.
4. قبل از تست `Alt+2` یا `Alt+PageDown` حداقل دو تب باز کنید.
5. در Windows قبل از نصب یا حذف، اپ را ببندید تا فایل تنظیمات قفل نباشد.

### نصب‌کننده `default.dat` را پیدا نمی‌کند

یک‌بار OpenCode Desktop را باز کنید تا تنظیماتش ساخته شود، بعد دوباره تلاش کنید. اگر build سفارشی یا portable دارید، مسیر را صریح بدهید:

```bash
node desktop/install.mjs --config /path/to/default.dat
```

### اپ آپدیت شد و یک میان‌بر از کار افتاد

`--check` را اجرا کنید و بعد نصب‌کننده را دوباره اجرا کنید. upstream می‌تواند نام یک فرمان داخلی را عوض کند. نصب‌کننده شناسه‌های گم‌شده را گزارش می‌کند و حدس نمی‌زند.

### میان‌برهای `Alt` در ترمینال TUI نمی‌رسند

- در macOS گزینهٔ **Option as Meta** را فعال کنید (iTerm2: _Profiles → Keys → Left/Right Option key → Esc+_).
- در tmux بررسی کنید که prefix یا تنظیمات ترمینال `Alt` را مصرف نکنند.
- در Hotkey Studio یک کلید function یا ترکیب `ctrl+shift+...` را امتحان کنید.

### `Ctrl+Tab` یا `Ctrl+1…9` در TUI کاری نمی‌کنند

بسیاری از ترمینال‌ها این ترکیب‌ها را برای جابه‌جایی تب رزرو می‌کنند. preset بومی را ترجیح دهید یا آن کارها را به ترکیب‌های `Alt` تغییر دهید.

### استودیوی TUI با میان‌بر قدیمی باز شد

این رفتار عمدی است: تغییرات استودیو در state محلی OpenCode ذخیره می‌شوند. از _Reset to preset_ یا _Reset all overrides_ استفاده کنید. مقدار صریح `bindings` در `tui.json` همیشه اولویت دارد.

## توسعه

```bash
bun install
bun run check        # typecheck + همهٔ تست‌ها
bun run format:check
npm pack --dry-run   # بررسی محتوای پکیج
```

پوشش تست شامل ادغام تنظیمات دسکتاپ، پشتیبان، dry-run، check، restore، uninstall، نرمال‌سازی کلیدهای TUI، presetها، تشخیص تداخل، ترتیب نشست‌ها، parse تنظیمات و تطابق فایل‌های preset است.

برای تست پلاگین TUI از یک checkout، `OPENCODE_TUI_CONFIG` را به یک config تست اشاره دهید و مسیر absolute `tui.ts` را در آرایهٔ `plugin` بگذارید.

## مشارکت

Issue و pull request خوش‌آمد است. قبل از باز کردن PR دستور `bun run check` را اجرا کنید و سطح OpenCode (دسکتاپ یا TUI)، نسخه، سیستم‌عامل و چیدمان کیبوردی که تست کرده‌اید را بنویسید.

## مجوز

[MIT](./LICENSE) © 2026 Nariman Khaleghi

---

<p align="center">
  <sub>وابسته به OpenCode، Obsidian، Google یا Chrome نیست. «Obsidian-style» فقط الگوی تعامل را توصیف می‌کند.</sub>
</p>

</div>
