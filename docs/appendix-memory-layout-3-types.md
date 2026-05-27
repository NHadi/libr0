# Visualizing Types

Let's see where different types memory layout:

### Simple Types (Copy)

```rust
let x: i32 = 42;
let y: bool = true;
let z: f64 = 3.14;
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">Tuple (stack)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">42 (4B)</span>
      <span class="mem-layout-block val">true (1B)</span>
      <span class="mem-layout-block val">3.14 (8B)</span>
    </div>
  </div>
</div>

### Arrays (Fixed Size)

```rust
let arr: [i32; 5] = [1, 2, 3, 4, 5];
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">arr (stack)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">1</span>
      <span class="mem-layout-block data">2</span>
      <span class="mem-layout-block data">3</span>
      <span class="mem-layout-block data">4</span>
      <span class="mem-layout-block data">5</span>
    </div>
  </div>
  <span class="mem-layout-note">Each element is 4 bytes &mdash; total 20 bytes on stack</span>
</div>

### Vec

```rust
let v = vec![1, 2, 3];
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">v (stack, 24B)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 3</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(heap)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">1</span>
      <span class="mem-layout-block data">2</span>
      <span class="mem-layout-block data">3</span>
      <span class="mem-layout-block freed">_</span>
      <span class="mem-layout-block freed">_</span>
    </div>
  </div>
  <span class="mem-layout-note">Stack: 24 bytes (3 &times; 8) &mdash; Heap: 20 bytes (5 &times; 4)</span>
</div>

Notice that `ptr`, `len`, and `cap` are all `usize`-sized — that's 8 bytes each
on a 64-bit system, giving us 3 × 8 = **24 bytes** on the stack.

`usize` is the pointer-sized unsigned integer: 8 bytes on 64-bit, 4 bytes on
32-bit. It matches the platform's address space.

For `ptr`, this is obvious — a pointer must be able to address any memory
location. But why are `len` and `cap` also `usize`?

- **They count bytes in memory.** The maximum number of bytes you can allocate
  is bounded by the address space. If `len` were `u32`, a `Vec` couldn't hold
  more than ~4 GB, even on a machine with terabytes of RAM. If it were `u64`,
  you'd waste 4 bytes on every `Vec` on 32-bit platforms for a size that could
  never be used. `usize` scales correctly to whatever platform you're on.

- **Rust uses `usize` for all indexing.** `v[i]` expects `i: usize`. If `len`
  were a different type, every bounds check and slice operation would need a
  cast.

| Platform | `usize` | Vec/String stack size |
| -------- | ------- | --------------------- |
| 64-bit   | 8 bytes | 3 × 8 = **24 bytes**  |
| 32-bit   | 4 bytes | 3 × 4 = **12 bytes**  |

### String

Remember, a `String` is basically a `Vec` of `u8`.

```rust
let s = String::from("café");
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">s (stack, 24B)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(heap)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">63 &lsquo;c&rsquo;</span>
      <span class="mem-layout-block data">61 &lsquo;a&rsquo;</span>
      <span class="mem-layout-block data">66 &lsquo;f&rsquo;</span>
      <span class="mem-layout-block data">C3</span>
      <span class="mem-layout-block data">A9</span>
    </div>
  </div>
  <span class="mem-layout-note">UTF-8: &lsquo;&eacute;&rsquo; = 2 bytes (C3 A9) &mdash; 5 bytes total, but only 4 chars!</span>
</div>

`String` stores UTF-8 encoded bytes, not characters. The `é` character needs
2 bytes (`0xC3 0xA9`), so `s.len() == 5` (bytes) while `s.chars().count() == 4`
(characters).

### String Literal (`&str`)

```rust
let s = "café";
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">s (stack, 16B)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(DATA segment)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">63 &lsquo;c&rsquo;</span>
      <span class="mem-layout-block data">61 &lsquo;a&rsquo;</span>
      <span class="mem-layout-block data">66 &lsquo;f&rsquo;</span>
      <span class="mem-layout-block data">C3</span>
      <span class="mem-layout-block data">A9</span>
    </div>
  </div>
  <span class="mem-layout-note">Fat pointer (ptr + len, no cap) &mdash; read-only view into binary</span>
</div>

A `&str` is a **fat pointer**: just a pointer and a length, no capacity. It's a
read-only view into bytes that already exist somewhere — in this case, the DATA
segment baked into the binary at compile time.

|                 | `String`                   | `&str`               |
| --------------- | -------------------------- | -------------------- |
| Stack size      | 24 bytes (ptr + len + cap) | 16 bytes (ptr + len) |
| Heap allocation | Yes                        | No                   |
| Growable        | Yes (`push_str`, `push`)   | No (read-only)       |
| Owns data       | Yes                        | No (borrows)         |

### Box

```rust
let b = Box::new(42);
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">b (stack, 8B)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(heap)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block val">42 (4B)</span>
    </div>
  </div>
  <span class="mem-layout-note">Stack: 8 bytes (pointer only) &mdash; Heap: 4 bytes (i32)</span>
</div>

### Nested Types

```rust
let v: Vec<String> = vec![
    String::from("hello"),
    String::from("world"),
];
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">v (stack, 24B)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 2</span>
      <span class="mem-layout-block cap">cap: 2</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">&nbsp;&nbsp;String[0]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(heap)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">h</span>
      <span class="mem-layout-block data">e</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">o</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">&nbsp;&nbsp;String[1]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 5</span>
      <span class="mem-layout-block cap">cap: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(heap)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">w</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">r</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">d</span>
    </div>
  </div>
  <span class="mem-layout-note">Three levels of indirection: Vec &rarr; String metadata &rarr; char data</span>
</div>

- Stack: 24 bytes (Vec metadata)
- Heap: 48 bytes (2 × String metadata: 2 × 24 bytes) + 10 bytes (string data)
- Total heap: 58 bytes

**Three levels of indirection!**

1. `v` points to array of `String`s
2. Each `String` points to its character data
3. All on the heap

Compare this with an array of string literals:

```rust
let arr: [&str; 2] = ["hello", "world"];
```

<div class="mem-layout">
  <div class="mem-layout-row">
    <span class="mem-layout-label">arr (stack, 32B)</span>
    <span class="mem-layout-heap-marker">[&amp;str; 2]</span>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">&nbsp;&nbsp;&amp;str[0]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(DATA)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">h</span>
      <span class="mem-layout-block data">e</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">o</span>
    </div>
  </div>
  <div class="mem-layout-row">
    <span class="mem-layout-label">&nbsp;&nbsp;&amp;str[1]</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 5</span>
    </div>
    <span class="mem-layout-arrow">&rarr;</span>
    <span class="mem-layout-heap-marker">(DATA)</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">w</span>
      <span class="mem-layout-block data">o</span>
      <span class="mem-layout-block data">r</span>
      <span class="mem-layout-block data">l</span>
      <span class="mem-layout-block data">d</span>
    </div>
  </div>
  <span class="mem-layout-note">Stack: 32 bytes (2 fat pointers) &mdash; Heap: 0 bytes! Data lives in binary</span>
</div>

- Stack: 32 bytes (2 × `&str`, each is a fat pointer: 8-byte ptr + 8-byte len)
- Heap: **0 bytes!** String literals live in the DATA segment, baked into the
  binary at compile time
- No `cap` field — `&str` is a read-only view, it can't grow

This is why `&str` is so cheap compared to `String`: no heap allocation, no
capacity tracking, just a pointer and a length.

## Common Misconceptions

### Misconception #1: "Box makes things bigger"

```rust
let x = 42;           // 4 bytes
let b = Box::new(42); // How many bytes?
```

**Answer:** `b` is 8 bytes (just a pointer), but total memory usage is 12 bytes (8 + 4).

**However:** Boxing can actually **save stack space** for large types:

```rust
let huge = [0u8; 1_000_000];        // 1 MB on stack! Dangerous!
let boxed = Box::new([0u8; 1_000_000]); // 8 bytes on stack, 1 MB on heap
```

### Misconception #2: "All heap allocations are slow"

Not all heap operations allocate:

```rust
let mut v = Vec::with_capacity(100);  // ✅ One allocation

for i in 0..50 {
    v.push(i);  // ✅ No allocation - within capacity
}

v.push(51);  // ✅ Still no allocation
v.push(52);  // ✅ Still no allocation
// ... up to 100 elements, still no allocation

v.push(101);  // ❌ NOW we reallocate (capacity exceeded)
```

Pre-allocating capacity is a common optimization!

## Performance Implications

### Stack Operations (Fast)

```rust
fn stack_test() {
    let x = 42;        // ~1 CPU cycle (write to pre-allocated stack slot)
    let y = x;         // ~1 CPU cycle (copy 4 bytes)
}
```

**Cost:** ~3 CPU cycles

### Heap Operations (Slow)

```rust
fn heap_test() {
    let x = Box::new(42);  // ~100 CPU cycles (call allocator)
    let y = x;             // ~1 CPU cycle (copy 8-byte pointer)
}  // ~100 CPU cycles (call deallocator)
```

**Cost:** ~200 CPU cycles

**100x slower!** But remember:

- This is microseconds, not seconds
- Sometimes you need the heap (dynamic size, large data, shared ownership)
- The real cost is in **many allocations**, not just one

### Optimization Tips

1. **Pre-allocate collections:**

```rust
// Bad: multiple allocations
let mut v = Vec::new();
for i in 0..1000 { v.push(i); }

// Good: one allocation
let mut v = Vec::with_capacity(1000);
for i in 0..1000 { v.push(i); }
```

2. **Use `&str` instead of `String` when possible:**

```rust
// Bad: allocates on heap
fn greet(name: String) {
    println!("Hello, {}", name);
}

// Good: no allocation
fn greet(name: &str) {
    println!("Hello, {}", name);
}
```

3. **Use `[T; N]` instead of `Vec<T>` for fixed-size data:**

```rust
// Bad: heap allocation
let v = vec![0; 10];

// Good: stack allocation
let arr = [0; 10];
```

4. **Avoid cloning when borrowing works:**

```rust
// Bad: clones the string (heap allocation)
fn process(s: String) {
    println!("{}", s);
}
let s = String::from("hello");
process(s.clone());

// Good: borrows (no allocation)
fn process(s: &str) {
    println!("{}", s);
}
process(&s);
```

## Key Takeaways

1. **Stack is automatic** - variables disappear when out of scope
2. **Heap is manual** - you allocate/deallocate (Rust automates via `Drop`)
3. **Stack is fast** - just move a pointer
4. **Heap is flexible** - dynamic size, outlives scope
5. **String/Vec/Box are smart pointers** - metadata on stack, data on heap
6. **Static data lives forever** - loaded at program start
7. **Use stack by default** - only heap allocate when necessary
8. **Pre-allocate when possible** - avoid repeated reallocations

## Further Reading

- [cheats.rs/#memory-layout](https://cheats.rs/#memory-layout) - Visual memory layouts for Rust types
- **The Rustonomicon**: Memory layout and representation
- **Rust Performance Book**: Memory allocation strategies
- **Operating Systems textbooks**: Virtual memory, process address space

---
