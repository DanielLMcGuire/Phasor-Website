
## Language Features

- **Dynamic typing** with integers, floats, strings, booleans, and of the least for last: null.
- **Functions** with optional type annotations
- **Structs** with static field access, with the benefit of being mostly untested!
- **Control flow**: if/else, while, for, switch/case, break/continue
- **Comprehensive standard library**: without anything smart to put here for appeal
- **Hybrid VM** supporting both stack-based and primarily register-based execution

Phasor is still in beta, as I wish for a **smooth, stable experience** for the final language. The existing implementation needs a ton of work.

### Upcoming

- Proposal based standard library updates (**Needs planning!**)
- Custom unix style environment for system level work (**Started**)

## Q/A

> **Q** - Why does the code look horrible?
>
> **A** - I let an AI agent go loose to *find* (not fix) issues, and it fixed almost 200K tokens worth of "issues" that weren't there.
>
> **Q** - What is this? Why would I even need this?
>
> **A** - Not sure.
>
> **Q** - Is this better than 'Java' or '.NET'?
>
> **A** - I have not tested Phasor against other languages, runtimes, VMs, etc.
>
> **Q** - This feels too much like 'JavaScript', is this intentional?
>
> **A** - No, in fact my goal was the opposite. I would have been better at that goal had I actually known JS when I wrote this. Instead I was forced to learn JS to make the website afterwards and noticed.
>
> **Q** - How to declare a constant?
>
> **A** - Everything is technically a constant, a variable is an technically in some way an extension of said constant. (TL;DR They are automatic)
>
> **Q** - How can I learn more?
>
> **A** - The following *might* be helpful:

## Quick Start

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

### Example Program

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

#### Applications

- **REPL** (`phasorrepl`) - Interactive interpreter
- **Bytecode Compiler** (`phasorcompiler`) - Script to bytecode compiler
- **Native Compiler** (`phasornative`) - Script to C++ transpiler
- **VM Runtime** (`phasorvm`) - Bytecode execution engine
- **JIT Runtime** (`phasorjit`) - Direct script execution
- **Shell** (`shell`) - Phasor-based command shell
- **Core Utils** (`cat-phs`, `cp-phs`, `echo-phs`, `ls-phs`, `mv-phs`, `rm-phs`, `touch-phs`) - Unix-like utilities

### Standard Library Modules

| Module      | Include Statement    | Functions                                                             |
| ----------- | -------------------- | --------------------------------------------------------------------- |
| **I/O**     | `include_stdio()`    | `puts`, `puts_error` `printf`, `gets`, `putf`, `msgbox`, `msgbox_err` |
| **Math**    | `include_stdmath()`  | `math_sqrt`, `math_pow`, `math_sin`, `math_cos`, etc.                 |
| **Strings** | `include_stdstr()`   | `len`, `substr`, `concat`, `to_upper`, `to_lower`                     |
| **Files**   | `include_stdfile()`  | `fread`, `fwrite`, `fexists`, `fcopy`, `fmove`                        |
| **System**  | `include_stdsys()`   | `time`, `sleep`, `sys_os`, `sys_exec`, `clear`                        |
| **Types**   | `include_stdtype()`  | `to_int`, `to_float`, `to_string`, `to_bool`                          |
| **Regex**   | `include_stdregex()` | `regex_match`, `regex_search`, `regex_replace`                        |

## Documentation

- **[Language Guide](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_phasor_language.md&name=Language%20Guide)** - Complete syntax and language features
- **[Standard Library Guide](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fguide_stdlib.md&name=Standard%20Library%20Guide)** - Comprehensive function reference guide
- **[Standard Library Specifications](/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fstd%2F2.0.0%2Flibrary.md)** - Standard Library Function Standard Specification 2.x.x
- **[Backend Specifications](/document.html?file=content/backend.md&name=Backend%20Specifications)**

---

**Phasor** - Fast, flexible programming/scripting with *near* native VM performance.

This project is licensed under the following agreements, which may be updated at any time, with or without notice, upon a new non-patch release of the language.

- Phasor Language / VM / Toolchain | [Phasor Restrictive License 1.3](/document.html?file=content%2Flegal%2Fphasorprl.txt&name=Phasor%20Restrictive%20License%201.3)
- Phasor Standard Library | [Phasor Open License 1.0](/document.html?file=content%2Flegal%2Fphasorpol.txt&name=Phasor%20Open%20License%201.0)
- Phasor Shell | [MIT License](https://opensource.org/license/mit)
- Phasor coreutils implementation | [GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)
- Phasor binary releases | [Phasor Binary EULA](/document.html?file=content%2Flegal%2Fphasorbineula.txt&name=Phasor%20Binary%20EULA)

Mentions of 'coreutils', the Free Software Foundation, Inc., 'Java™', Oracle® Corporation, '.NET™', Microsoft® Corporation, Google® LLC, or other third-party companies, products, or trademarks do not imply any affiliation, endorsement, or sponsorship by those third parties, or thier affiliates, unless explicitly stated otherwise.
