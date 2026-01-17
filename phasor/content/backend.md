## Language Features

- **Hybrid VM** supporting both stack-based and primarily register-based execution

### Upcoming

- Microkernel-like architecture using native assembly to define all VM opcodes (**Nearly there!**)
- C based standard library replacing remaining C++ parts (**Started**)

### Virtual Machine (v2.0)

- **Hybrid execution**: Stack-based and register-based opcodes in the same instruction stream
- **Native assembly** optimizations for critical operations across platforms
- **Struct support** with static field access for performance

### Platform Support

- **Windows** (x64, ARM64) with MSVC
- **Linux** (x64, ARM64) with GCC/Clang
- **macOS/BSD** (x64, ARM64) with Clang

## Documentation

- **[VM Internals](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_vm_internals.md&name=VM%20Internals)** - Virtual machine architecture details
- **[Adding Opcodes](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_adding_opcodes.md&name=Adding%20Opcodes)** - Contributor guide for VM extensions

## Building

### Prerequisites

- CMake 3.10+
- C++17 compiler (MSVC, GCC, Clang)

### Build Steps

```bash
cmake -S . -B build
cmake --build build --config Release (-DASSEMBLY=[ON,OFF] (Off is recommended! The Assembly Operation set is experimental.))
cmake --install build --prefix install
```

### Generation/Build Options

- `ASSEMBLY=ON/OFF` - Enable/disable native assembly optimizations (default: OFF)

## Output

Binaries are available in the `install` directory:

- `bin/` - All executables and utilities
- `lib/` - Runtime libraries (static and shared)

## Contributing

1. Read the [VM Internals](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_vm_internals.md&name=VM%20Internals) and [Adding Opcodes](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_adding_opcodes.md&name=Adding%20Opcodes) guides
2. Follow the existing code style (see `.clang-format`)
3. Add tests for new features
4. Update documentation as needed

---

**Phasor** - Fast, flexible programming/scripting with *near* native VM performance.

Inspired by Java's ecosystem, .NET's Roslyn stuff, C-style syntax, and the x86 and arm64 architectures for the VM.

This project is licensed under the following agreements, which may be updated at any time, with or without notice, upon a new non-patch release of the language.

- Phasor Language / VM / Toolchain | [Phasor Restrictive License 1.3](/document.html?file=content%2Flegal%2Fphasorprl.txt&name=Phasor%20Restrictive%20License%201.3)
- Phasor Standard Library | [Phasor Open License 1.0](/document.html?file=content%2Flegal%2Fphasorpol.txt&name=Phasor%20Open%20License%201.0)
- Phasor Shell | [MIT License](https://opensource.org/license/mit)
- Phasor coreutils implementation | [GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)
- Phasor binary releases | [Phasor Binary EULA](/document.html?file=content%2Flegal%2Fphasorbineula.txt&name=Phasor%20Binary%20EULA)

Mentions of 'coreutils', the Free Software Foundation, Inc., 'Java™', Oracle® Corporation, '.NET™', Microsoft® Corporation, Google® LLC, or other third-party companies, products, or trademarks do not imply any affiliation, endorsement, or sponsorship by those third parties, or thier affiliates, unless explicitly stated otherwise.
