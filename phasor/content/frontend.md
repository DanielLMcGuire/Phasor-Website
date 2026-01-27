## Language Features

- **Dynamic typing** with integers, floats (IEEE 754, double-percision), strings, booleans, and null. ```var x = 21; // int```
- **Functions** with forced type annotations ```fn func(input: string) -> void { ... }```
- **C-style Control flow**: if/else, while, for, switch/case, break/continue
- **Comprehensive standard library**
- **Windows API Bindings**

## Upcoming (Some may appear to work before actual implementation)

- **Structs** with C style static field access, mostly untested. ```struct.member = 14;```
- **Arrays** are being tested with C syntax ```var arrayName[arraySize];``` 
- C based standard library replacing remaining C++ parts (**Started**)
- **POSIX API Bindings**

---

Phasor is still in beta, as I wish for a **smooth, stable experience** for the final language. The existing implementation is stable (as far as I know) but it needs some work.

## Q/A

> **Q** - Where did the idea come from?
>
> **A** - My inspiration came from a few places, TS, C99, Zig, Rust, etc. I was bored.
>
> **Q** - What is this? Why would I even need this?
>
> **A** - You don't, but it could become useful as it evolves.
>
> **Q** - Is this better than 'Java' or '.NET'?
>
> **A** - I have not tested Phasor against other languages, runtimes, VMs, or even native programs. My intention is a working stable language, not competition

## Start with phasor

```bash
# Open phasor shell (optional)
./shell

# Compile and run a program
phasorjit input.phs

# Interactive REPL
phasorrepl

# Compile to bytecode
phasorcompiler input.phs (-o, --output output.phsb)

# Compile to Phasor VM IR
phasorcompiler -i, --ir input.phs (-o, --output output.phir)

# Run bytecode
phasorvm output.phsb

# Compile to Native
cp src/App/Runtime/NativeRuntime_[static,dynamic]_main.cpp main.cpp

phasornative -c, --compiler clang++ -l, --linker lld -s, --source main.cpp input.phs -o, --output output
````

### Write a program

```javascript
include_stdio();
include_stdstr();

fn factorial(n: int) -> int {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

puts("Enter a number:");
var input = gets();
var num = to_int(input);
var result = factorial(num);
putf("%d! = %d\n", num, result);
```

#### The new ecosystem

- **REPL** ([`phasorrepl`](https://phasor-docs.pages.dev/man?f=phasorrepl.1)) - Interactive interpreter
- **Bytecode Compiler** ([`phasorcompiler`](https://phasor-docs.pages.dev/man?f=phasorcompiler.1)) - Script to bytecode compiler
- **Native Compiler** ([`phasornative`](https://phasor-docs.pages.dev/man?f=phasornative.1)) - Script to C++ transpiler
- **VM Runtime** ([`phasorvm`](https://phasor-docs.pages.dev/man?f=phasorvm.1)) - Bytecode execution engine
- **JIT Runtime** ([`phasorjit`](https://phasor-docs.pages.dev/man?f=phasorjit.1)) - Direct script execution
- **Shell** (`shell`) - Phasor-based command shell **PREVIEW**
- **Core Utils** (`cat-phs`, `cp-phs`, `echo-phs`, `ls-phs`, `mv-phs`, `rm-phs`, `touch-phs`) - Unix-like utilities **PREVIEW**

### Phasor's (tiny) standard library

| Module      | Include Statement    | Functions                                                             |
| ----------- | -------------------- | --------------------------------------------------------------------- |
| **I/O**     | `include_stdio()`    | `puts`, `puts_error` `printf`, `gets`, `putf`, `msgbox`, `msgbox_err` |
| **Math**    | `include_stdmath()`  | `math_sqrt`, `math_pow`, `math_sin`, `math_cos`, etc.                 |
| **Strings** | `include_stdstr()`   | `len`, `substr`, `concat`, `to_upper`, `to_lower`                     |
| **Files**   | `include_stdfile()`  | `fread`, `fwrite`, `fexists`, `fcopy`, `fmove`                        |
| **System**  | `include_stdsys()`   | `time`, `sleep`, `sys_os`, `sys_exec`, `clear`                        |
| **Types**   | `include_stdtype()`  | `to_int`, `to_float`, `to_string`, `to_bool`                          |
| **Regex**   | `include_stdregex()` | `regex_match`, `regex_search`, `regex_replace`                        |

## Docs

- **[Language Guide](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_phasor_language.md&name=Language%20Guide)** - Complete syntax and language features
- **[Standard Library Guide](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_stdlib.md&name=Standard%20Library%20Guide)** - Comprehensive function reference guide
- **[Standard Library Specifications](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fstd%2F2.0.0%2Flibrary.md)** - Standard Library Function Standard Specification 2.x.x
- **[Backend Specifications](/document.html?file=content/backend.md&name=Backend%20Specifications)**

---

**Phasor** - A fast Language, Standard Library, Toolchain, VM, and ISA.

This project is licensed under the following agreements, which may be updated at any time, with or without notice, upon a new non-patch release of the language.

- Phasor Language / ISA / VM / Toolchain / Standard Library | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt)
- Phasor Shell | [MIT License](https://opensource.org/license/mit)
- Phasor coreutils implementation | [GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)
- Phasor binary releases | [Phasor Binary EULA](https://phasor.pages.dev/document?file=content%2Flegal%2Fphasorbineula.txt&name=Phasor%20Binary%20EULA)

Mentions of 'coreutils', the Free Software Foundation, Inc., 'Java™', Oracle® Corporation, '.NET™', Microsoft® Corporation, Google® LLC, or other third-party companies, products, or trademarks do not imply any affiliation, endorsement, or sponsorship by those third parties, or thier affiliates, unless explicitly stated otherwise.
