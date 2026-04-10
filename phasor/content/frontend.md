[![Release](https://img.shields.io/github/v/release/DanielLMcGuire/Phasor.svg?style=flat-square)](https://phasor.pages.dev/downloads?version=latest)
[![AUR Version](https://img.shields.io/aur/version/phasor.svg?style=flat-square)](https://aur.archlinux.org/packages/phasor)
![GitHub branch check runs](https://img.shields.io/github/check-runs/DanielLMcGuire/Phasor/master.svg?style=flat-square)
![GitHub commit activity](https://img.shields.io/github/commit-activity/w/DanielLMcGuire/Phasor.svg?label=commits&style=flat-square)

```bash
$ nix run github:DanielLMcGuire/Phasor
```

```javascript
using("stdio");
puts("Hello, World!");
```

---

## Features

- **Dynamic typing** — integers, floats (IEEE 754 double-precision), strings, booleans, and null
- **Type annotations** in function declarations: `fn greet(name: string) -> void { ... }`
- **Control flow** — if/else, while, for, switch/case, break/continue
- **Standard library** via `using("featureName")`
- **Plugin/FFI API** — extend Phasor with native C code
- **C format specifier support** — familiar `printf`-style formatting
- **Windows and POSIX API bindings** built in

---

## Toolchain

| Tool | Description |
|---|---|
| `phasor` | All-in-one: Script runner, REPL, pipe-in, and shebang support |
| `phasorvm` | Execute compiled bytecode |
| `phasorcompiler` | Compile scripts to bytecode |
| `phasornative` | Compile scripts and wrap to native binary |
| `phasorrepl` | Interactive REPL |
| `phasor-lsp` | JSON-RPC 2.0 language server for editor integration |

---

## Quick Start

```bash
# Run a script
phasor script.phs

# Interactive REPL
phasor

# Compile to bytecode, then run
phasorcompiler script.phs -o out.phsb
phasorvm out.phsb
```

### Example

```javascript
using("stdio", "stdtype");

puts("Enter a number:");
var input = gets();
var num = to_int(input);
var result = num + 25;

putf("%d + 25 = %d\n", num, result);
```

---

## Documentation

- [Language Guide](https://phasor.pages.dev/document?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_phasor_language.md&name=Language%20Guide) — Syntax and language features
- [VM Internals](https://phasor.pages.dev/document?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_vm_internals.md&name=VM%20Internals) — Virtual machine architecture
- [Doxygen Reference](https://phasor-docs.pages.dev) — Generated source documentation and call graphs
- [Man Pages](https://phasor-docs.pages.dev/man?f=Phasor.3) — `phasorvm`, `phasorjit`, `phasorcompiler`, and more

---

## License

- Phasor Language / ISA / VM / Toolchain / Standard Library — [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt)
- Phasor Shell — [MIT](https://opensource.org/license/mit)
- Phasor Core Utils — [GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)