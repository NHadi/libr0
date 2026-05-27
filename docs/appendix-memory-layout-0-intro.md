# Appendix: Memory Layout - Where Your Data Lives

This document demystifies where your Rust data actually lives in memory. We'll visualize the process memory layout and understand the stack, heap, and static data segments.

**Recommended resource:** [cheats.rs/#memory-layout](https://cheats.rs/#memory-layout) provides excellent visual memory layouts for Rust types.

## The Simple Program

Let's start with a concrete Rust program and trace where everything lives:

```rust
// Global/static data - lives in data segment
static GLOBAL_S: &str = "Global";
static mut GLOBAL_N: u32 = 10;
static mut BUFFER: [u8; 10_000] = [0; 10_000];  // 10 KB zero-initialized

fn main() {
    // Stack: local variables
    let x = 42;
    let y = 100;

    // Stack: String struct (24 bytes: ptr + len + cap)
    // Heap: actual string data "Local"
    let s = String::from("Local");

    // Stack: vector struct (24 bytes: ptr + len + cap)
    // Heap: array data [1, 2, 3, 4, 5]
    let v = vec![1, 2, 3, 4, 5];

    // Stack: native array - all data lives on stack (20 bytes)
    let arr = [10, 20, 30, 40, 50];

    // Stack: function call frame
    // Passing by value (x) and by reference (&s)
    let doubled = process_data(x, &s);

    println!("{} -> {}", x, doubled);
}

fn process_data(param_num: i32, param_text: &String) -> i32 {
    // Stack: new function frame
    // Arguments passed:
    // - param_num: COPY of x's value (42) - passed by value
    // - param_text: pointer to s (on stack) - passed by reference
    let result = param_num * 2;
    println!("{}: {}", param_text, result);

    // Return: result is COPIED to caller's stack frame
    result  // Returns 84
}
```

Now let's see where each piece of data lives in memory.

## Process Memory Layout

When your Rust program runs, the operating system gives it a contiguous chunk of virtual memory organized into distinct regions:

<div class="mem-layout">
  <div class="mem-layout-note">High Memory Addresses (0x0000_7FFF_FFFF_FFFF - User Space upper bound)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">STACK</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">STACK</span>
      <span class="mem-layout-block val">Function frames, local variables</span>
    </div>
    <span class="mem-layout-note">&larr; Grows downward</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label"></span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block freed">&darr; unused space &uarr;</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">HEAP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">HEAP</span>
      <span class="mem-layout-block ptr">Dynamically allocated: Box, Vec, String</span>
    </div>
    <span class="mem-layout-note">&larr; Grows upward</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">DATA</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">DATA SEGMENT</span>
      <span class="mem-layout-block data">.bss: uninitialized</span>
      <span class="mem-layout-block data">.data: initialized mutable</span>
    </div>
    <span class="mem-layout-note">Read + Write</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">RODATA</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">RODATA SEGMENT</span>
      <span class="mem-layout-block len">static, const, string literals</span>
    </div>
    <span class="mem-layout-note">Read-Only</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">TEXT</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">TEXT SEGMENT</span>
      <span class="mem-layout-block val">Your compiled functions</span>
    </div>
    <span class="mem-layout-note">Read + Execute</span>
  </div>
  <div class="mem-layout-note">Low Memory Addresses (0x0000_0000_0000_0000)</div>
</div>

**Key Insight:** The stack and heap grow toward each other!

## Let's Trace Our Program

Now let's see exactly where each piece of data from our example lives.

### Step 1: Program Starts - Static Data is Loaded

Before `main()` even runs, the OS loads static data into the DATA segment:

<div class="mem-layout">
  <div class="mem-layout-note">High Memory Addresses (0x0000_7FFF_FFFF_FFFF)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">STACK</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block freed">(empty at start)</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label"></span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block freed">(unused space)</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">HEAP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block freed">(empty at start)</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">.bss section</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">DATA SEGMENT</span>
      <span class="mem-layout-block data">BUFFER [u8; 10_000]</span>
      <span class="mem-layout-block val">0</span>
      <span class="mem-layout-block val">0</span>
      <span class="mem-layout-block val">0</span>
      <span class="mem-layout-block freed">...</span>
      <span class="mem-layout-block val">0</span>
    </div>
    <span class="mem-layout-note">10KB, all zeros</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">.data section</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">GLOBAL_N: u32</span>
      <span class="mem-layout-block val">10</span>
    </div>
    <span class="mem-layout-note">Initialized Mutable</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">.rodata (statics)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">RODATA</span>
      <span class="mem-layout-block len">GLOBAL_S: &amp;str</span>
      <span class="mem-layout-block len">len: 6</span>
      <span class="mem-layout-block ptr">ptr &rarr;</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">.rodata (literals)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">G</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">b</span>
      <span class="mem-layout-block data">a</span>
      <span class="mem-layout-block data">l</span>
    </div>
    <span class="mem-layout-arrow">&larr;</span>
    <span class="mem-layout-note">GLOBAL_S.ptr points here</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px"></span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">L</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">c</span>
      <span class="mem-layout-block data">a</span>
      <span class="mem-layout-block data">l</span>
    </div>
    <span class="mem-layout-note">"Local" literal (used later by String::from)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">TEXT (Code)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">TEXT</span>
      <span class="mem-layout-block val">fn main() { ... }</span>
      <span class="mem-layout-block val">fn process_data() { ... }</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px"></span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">fn println!()</span>
      <span class="mem-layout-block val">fn std::alloc::alloc()</span>
      <span class="mem-layout-block val">fn Vec::push()</span>
    </div>
    <span class="mem-layout-note">Rust standard library</span>
  </div>
  <div class="mem-layout-note">Low Memory Addresses (0x0000_0000_0000_0000)</div>
</div>

### Step 2: main() Executes - Local Variables on Stack

When `main()` is called, the function's **prologue** (compiler-generated instructions at the beginning of the function) creates a stack frame by adjusting the stack pointer (typically `sub rsp, N` where N is the size needed for local variables). After all local variables are initialized (right before calling `process_data(x, &s)`), the stack looks like this:

<div class="mem-layout">
  <div class="mem-layout-note">main's stack frame — 0x7FFF_FFFF_FFF0 (high address)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">Return address</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ret addr</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">Saved RBP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">rbp</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">x: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">42</span>
    </div>
    <span class="mem-layout-note">4 bytes</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">y: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">100</span>
    </div>
    <span class="mem-layout-note">4 bytes</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">doubled: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block freed">?</span>
    </div>
    <span class="mem-layout-note">4 bytes (uninitialized)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">arr: [i32; 5]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">10</span>
      <span class="mem-layout-block val">20</span>
      <span class="mem-layout-block val">30</span>
      <span class="mem-layout-block val">40</span>
      <span class="mem-layout-block val">50</span>
    </div>
    <span class="mem-layout-note">20 bytes, entirely on stack</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">s: String</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr →</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-note">24 bytes on stack</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">v: Vec&lt;i32&gt;</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr →</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-note">24 bytes on stack</span>
  </div>
  <div class="mem-layout-note">↑ RSP points here after prologue</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label"></span>
    <div class="mem-layout-blocks">
    </div>
  </div>
  <div class="mem-layout-note">HEAP</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">v.ptr →</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">1</span>
      <span class="mem-layout-block val">2</span>
      <span class="mem-layout-block val">3</span>
      <span class="mem-layout-block val">4</span>
      <span class="mem-layout-block val">5</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">s.ptr →</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">L</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">c</span>
      <span class="mem-layout-block data">a</span>
      <span class="mem-layout-block data">l</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
</div>

**Important observations:**

1. **`x` and `y`** are just 4 bytes each, living directly on the stack
2. **`s` (String)** is 24 bytes on the stack (metadata: pointer, length, capacity)
   - The **actual string data** "Local" lives on the heap
3. **`v` (Vec)** is 24 bytes on the stack (metadata: pointer, length, capacity)
   - The **actual array data** [1,2,3,4,5] lives on the heap
4. **`arr` (native array)** is 20 bytes entirely on the stack (no heap allocation!)
   - All 5 integers live directly in the array, no pointer indirection

### Step 3: Calling process_data() - New Stack Frame and Passing Arguments

When we call `process_data(x, &s)`, here's what the CPU actually does (x86-64 calling convention):

1. **Arguments loaded into registers** (not pushed to stack!):
   - `x` (i32, 4 bytes): Loaded into `EDI` register → becomes `param_num`
   - `&s` (&String, 8 bytes): Pointer loaded into `RSI` register → becomes `param_text`
   - **There is no param_num or param_text in memory** - they ARE the registers themselves
2. **CALL instruction executes**: Pushes return address onto stack, then jumps to process_data
3. **Callee (process_data) sets up its stack frame**:
   - Saves registers if needed
   - Allocates space for local variables
   - May spill register arguments to stack (compiler's choice)

<div class="mem-layout">
  <div class="mem-layout-note">CPU REGISTERS (not in memory!)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">RBP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">0x7FFF_FFFF_FF00</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">RSP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">0x7FFF_FFFF_FE00</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">EDI</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">42 (param_num)</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">RSI</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">param_text → &amp;s on stack</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label"></span>
    <div class="mem-layout-blocks">
    </div>
  </div>
  <div class="mem-layout-note">STACK</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">main()'s frame</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">main</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  Return address</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ret addr to OS</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  Saved RBP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">main's RBP</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  x: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">42</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  y: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">100</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  doubled: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block freed">???</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  arr: [i32; 5]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">10</span>
      <span class="mem-layout-block val">20</span>
      <span class="mem-layout-block val">30</span>
      <span class="mem-layout-block val">40</span>
      <span class="mem-layout-block val">50</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  s: String</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr →</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-note">&larr; RSI (param_text) points here</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  v: Vec&lt;i32&gt;</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr →</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">process_data()</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block tag">process_data</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  Return address</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ret addr to main</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  Saved RBP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">0x7F.. (push rbp)</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label" style="min-width:160px">  result: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">84</span>
    </div>
  </div>
  <div class="mem-layout-note">↑ RSP points here (after prologue)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label"></span>
    <div class="mem-layout-blocks">
    </div>
  </div>
  <div class="mem-layout-note">HEAP</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">v.ptr →</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">1</span>
      <span class="mem-layout-block val">2</span>
      <span class="mem-layout-block val">3</span>
      <span class="mem-layout-block val">4</span>
      <span class="mem-layout-block val">5</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">s.ptr →</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">L</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">c</span>
      <span class="mem-layout-block data">a</span>
      <span class="mem-layout-block data">l</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
</div>

Key observations about arguments and returns:\*\*

1. **`param_num` and `param_text` are in CPU REGISTERS, not in memory!**
   - `param_num` (value 42) lives in the EDI register
   - `param_text` (pointer to s) lives in the RSI register
   - They are NOT stored on the stack (unless the compiler decides to spill them later)

2. **Pass by value vs by reference both use registers**:
   - Pass by value (`x`): The value 42 is copied into EDI register
   - Pass by reference (`&s`): The pointer to s (address on stack) is copied into RSI register

3. **`doubled` variable** in main's frame has space allocated but isn't set yet - it will receive the return value

4. **Stack frames stack up** - process_data's frame sits on top of main's frame

5. **The heap data doesn't move** - only stack frames are created/destroyed

6. **`arr` stays on the stack** in main's frame - native arrays don't involve heap

**How arguments are actually passed (x86-64 System V ABI):**

```asm
; Conceptual assembly for: let doubled = process_data(x, &s);

mov    edi, DWORD PTR [rbp-4]    ; Load x (42), located at rbp-4 into EDI register
lea    rsi, [rbp-32]             ; Load address of s into RSI register (pointer to s on stack)
call   process_data              ; CALL pushes return address, jumps to function
```

Inside `process_data`

```asm

; Arguments are in registers: EDI = 42, RSI = pointer to s

; Function prologue - setting up stack frame:
push   rbp                       ; Save caller's base pointer
mov    rbp, rsp                  ; Set up our base pointer
sub    rsp, 16                   ; Allocate space for local variables (result, etc.)

; Now we can execute the function body:
; let result = param_num * 2;
mov    eax, edi                  ; Load param_num (42) into EAX
shl    eax, 1                    ; Multiply by 2 (shift left) -> EAX = 84
mov    DWORD PTR [rbp-4], eax    ; Store result on stack

; ... println! call happens here ...

; Return preparation:
mov    eax, DWORD PTR [rbp-4]    ; Load result (84) into EAX (return register)

; Function epilogue - cleanup:
add    rsp, 16                   ; Deallocate local variables
pop    rbp                       ; Restore caller's base pointer
ret                              ; Return to caller (pops return address, jumps back)
```

**Key points:**

1. **Arguments go into registers first** (not pushed to stack):
   - First 6 integer/pointer arguments use: RDI, RSI, RDX, RCX, R8, R9
   - Our i32 uses EDI (lower 32 bits of RDI)
   - Our &String uses RSI (just a single pointer, 8 bytes)

2. **CALL instruction** pushes return address onto stack automatically

3. **Compiler may spill to stack** if:
   - Register needed for other operations
   - Function has too many arguments (7+ integers)
   - Debugging is enabled (makes variables inspectable)

4. **Pass by value vs by reference** both use registers - the difference is what's copied:
   - **By value (`x`)**: The actual value (42) is copied into EDI
   - **By reference (`&s`)**: Only the pointer to s (8 bytes) is copied into RSI, pointing to s on the stack

### Step 4: process_data() Returns - Value Copied Back and Stack Frame Destroyed

When `process_data()` returns, two things happen:

1. **Return value is copied**: The value in `result` (84) is **copied** to `doubled` in main's frame (using CPU register or direct memory copy)
2. **Stack frame is popped**: process_data's entire frame is destroyed

<div class="mem-layout">
  <div class="mem-layout-note">STACK — main's frame (after process_data returns)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">Return address</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ret addr</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">Saved RBP</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">rbp</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">x: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">42</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">y: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">100</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">doubled: i32</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">84</span>
    </div>
    <span class="mem-layout-note">&larr; Return value COPIED here (4 bytes)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">arr: [i32; 5]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">10</span>
      <span class="mem-layout-block val">20</span>
      <span class="mem-layout-block val">30</span>
      <span class="mem-layout-block val">40</span>
      <span class="mem-layout-block val">50</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">s: String</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr →</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">v: Vec&lt;i32&gt;</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr →</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label"></span>
    <div class="mem-layout-blocks">
    </div>
  </div>
  <div class="mem-layout-note">HEAP (unchanged)</div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">v.ptr →</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">1</span>
      <span class="mem-layout-block val">2</span>
      <span class="mem-layout-block val">3</span>
      <span class="mem-layout-block val">4</span>
      <span class="mem-layout-block val">5</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">s.ptr →</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">L</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">c</span>
      <span class="mem-layout-block data">a</span>
      <span class="mem-layout-block data">l</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
</div>

**Key observations about returns:**

1. **Return value is copied**: The 4 bytes of `result` are copied (typically via CPU register like `RAX` on x86-64, then to stack)
2. **process_data's stack frame is gone**: All local variables (param_num, param_text, result) are destroyed
3. **The heap data remains untouched**: Only stack frames change, heap is unaffected
4. **doubled now has the value 84**: Ready to be used by main

**How return values work:**

- **Small values** (like i32, 4 bytes): Returned via CPU register (RAX on x86-64), then copied to destination
- **Larger values** (like structs): Caller pre-allocates space, callee writes directly to it
- **Owned heap types** (like Vec, String): Only the metadata is copied (24 bytes), heap data stays put

### Step 5: main() Ends - Cleanup

When `main()` returns, `s` and `v` go out of scope. Their `Drop` implementations run:

1. **`s` is dropped**: Calls `dealloc()` to free the heap memory
2. **`v` is dropped**: Calls `dealloc()` to free the heap memory
3. **main's stack frame is popped**: All local variables disappear

