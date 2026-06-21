[![Release](https://img.shields.io/github/v/release/DanielLMcGuire/Phasor.svg)](https://phasor.pages.dev/downloads?version=latest)
[![AUR Version](https://img.shields.io/aur/version/phasor.svg)](https://aur.archlinux.org/packages/phasor)
![GitHub branch check runs](https://img.shields.io/github/check-runs/DanielLMcGuire/Phasor/master.svg)
![GitHub commit activity](https://img.shields.io/github/commit-activity/w/DanielLMcGuire/Phasor.svg?label=commits)

A dynamically typed compiled language with a bytecode VM. User defined functions use static parameter and return types, while the runtime remains dynamically typed.

Phasor does not use a traditional garbage collector. It relies on a unified type system with RAII style resource management across the runtime, standard library, and FFI. Memory is deterministic and cleaned up at shutdown or when explicitly nulled.

Phasor isbeta, with an expanding ABI and a focus on long-term stability and long-term usability.

[Download Latest Stable](https://github.com/DanielLMcGuire/Phasor/releases/latest)
[Download Latest Nightly](https://github.com/DanielLMcGuire/Phasor/actions/workflows/nightly.yml?query=is%3Asuccess+branch%3Amaster)

```bash
# Run via nix
nix run github:DanielLMcGuire/Phasor [-- -- OPTIONS]

# Installed
phasor [OPTIONS]
```

```javascript
using("stdio");
puts("Hello, World!");
```

## Language Features

* Dynamic typing: int, float (IEEE 754), string, bool, null
* Structs, arrays, and uniform function call syntax
* Type annotated functions with enforced signatures
* Control flow: if, else, loops, switch, break, continue
* Standard library via `using("module")`
* Plugin and FFI support for native extensions
* C style formatting support for printf style output
* Built in Windows and POSIX bindings
* stdmem module for explicit free or null based cleanup

## Toolchain

| Tool           | Purpose                       |
| -------------- | ----------------------------- |
| phasor         | Runner, REPL, scripting entry |
| phasorvm       | Bytecode execution            |
| phasorcompiler | Script to bytecode            |
| phasornative   | Native build wrapper          |
| phasorrepl     | Interactive shell             |
| phasor-lsp     | Language server (JSON RPC)    |

## Quick Start

```bash
phasor script.phs
phasor
phasorcompiler script.phs -o out.phsb
phasorvm out.phsb
```

## Example

```javascript
using("stdio", "stdtype");

puts("Enter a number:");
var input: string = gets();
var num: int = to_int(input);
putf("%d + 25 = %d\n", num, num + 25);
```

## License

* Toolchain: Apache 2.0
* Runtime: Apache 2.0 with LLVM Exceptions
