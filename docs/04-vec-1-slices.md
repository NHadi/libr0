# Slices, Strings & Operations

## Slices: Views into Vec

**Important:** Unlike `Vec`, `Option`, `Result`, or `Box`, slices (`[T]` and `&[T]`) are a **language primitive** built into the Rust compiler. You cannot implement your own slice type with identical behavior.

Why slices are special:

- `[T]` is a **dynamically sized type (DST)** - no known size at compile time
- The compiler has special knowledge of slices for:
  - Array to slice coercion: `&[1, 2, 3]` automatically becomes `&[i32]`
  - Slice syntax: `&vec[1..3]` uses built-in range operators
  - Pattern matching: `match slice { [first, rest @ ..] => ... }`
  - Indexing bounds checks are optimized by the compiler

**Can we implement something slice-like?** Yes! We can create a struct with `(ptr, len)` that _behaves_ like a slice, but it won't have the same compiler integration. We'll show this in the exercises.

A slice `&[T]` is a _view_ into contiguous memory. It's a fat pointer:

<div class="mem-layout">
  <div class="mem-layout-row">
    <div class="mem-layout-label">&amp;[T]</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len</span>
    </div>
    <span class="mem-layout-arrow">→</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">T</span>
      <span class="mem-layout-block data">T</span>
      <span class="mem-layout-block data">T</span>
    </div>
    <span class="mem-layout-heap-marker">(contiguous memory)</span>
  </div>
  <div class="mem-layout-note">Fat pointer: 16 bytes on 64-bit (8-byte ptr + 8-byte len). Points into existing data — no ownership.</div>
</div>

Convert `Vec<T>` to `&[T]`:

```rust
impl<T> Vec0<T> {
    pub fn as_slice(&self) -> &[T] {
        unsafe {
            std::slice::from_raw_parts(self.ptr, self.len)
        }
    }

    pub fn as_mut_slice(&mut self) -> &mut [T] {
        unsafe {
            std::slice::from_raw_parts_mut(self.ptr, self.len)
        }
    }
}
```

Now we can use slice methods:

```rust
let mut vec = Vec0::new();
vec.push(1);
vec.push(2);
vec.push(3);

let slice = vec.as_slice();
slice.len()      // 3
slice[0]         // 1
slice.iter()     // Iterator over &T
```

### Deref Coercion

Make `Vec0<T>` deref to `[T]`:

```rust
use std::ops::{Deref, DerefMut};

impl<T> Deref for Vec0<T> {
    type Target = [T];

    fn deref(&self) -> &[T] {
        self.as_slice()
    }
}

impl<T> DerefMut for Vec0<T> {
    fn deref_mut(&mut self) -> &mut [T] {
        self.as_mut_slice()
    }
}
```

Now we can call slice methods directly:

```rust
let mut vec = Vec0::new();
vec.push(3);
vec.push(1);
vec.push(2);

vec.sort();       // Calls [T]::sort()
vec.len()         // Works! (both Vec and slice have len())
vec.iter()        // Calls [T]::iter()
```

## String is Just Vec<u8>

`String` is literally:

```rust
pub struct String {
    vec: Vec<u8>,
}
```

All String methods delegate to Vec:

```rust
impl String {
    pub fn new() -> String {
        String { vec: Vec::new() }
    }

    pub fn push_str(&mut self, s: &str) {
        self.vec.extend_from_slice(s.as_bytes());
    }

    pub fn as_str(&self) -> &str {
        unsafe {
            std::str::from_utf8_unchecked(&self.vec)
        }
    }
}
```

### str is a Slice

`&str` is to `String` what `&[T]` is to `Vec<T>`:

```
String          &str
Vec<u8>         &[u8]  (but guaranteed valid UTF-8)
```

Both are fat pointers:

```rust
&str = (ptr: *const u8, len: usize)
```

```rust
let s = String::from("hello");
let slice: &str = &s[0..3];  // "hel"
```

## Memory Layout Comparison

### Array: Stack

`[1, 2, 3]`

<div class="mem-layout">
  <div class="mem-layout-row">
    <div class="mem-layout-label">Stack</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">1</span>
      <span class="mem-layout-block data">2</span>
      <span class="mem-layout-block data">3</span>
    </div>
  </div>
  <div class="mem-layout-note">12 bytes on stack. No heap allocation, no indirection.</div>
</div>

### Box: Heap (single value)

**`Box::new([1, 2, 3])`**

<div class="mem-layout">
  <div class="mem-layout-row">
    <div class="mem-layout-label">Stack</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
    </div>
    <span class="mem-layout-arrow">→</span>
    <div class="mem-layout-label">Heap</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">1</span>
      <span class="mem-layout-block data">2</span>
      <span class="mem-layout-block data">3</span>
    </div>
  </div>
  <div class="mem-layout-note">8 bytes on stack (pointer). 12 bytes on heap (data). Single owner.</div>
</div>

### Vec: Heap (growable)

**After `vec.push(1); vec.push(2); vec.push(3); ... ; vec.push(7)`**

<div class="mem-layout">
  <div class="mem-layout-row">
    <div class="mem-layout-label">vec: Vec&lt;i32&gt;</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 7</span>
      <span class="mem-layout-block cap">cap: 10</span>
    </div>
    <span class="mem-layout-arrow">→</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">1</span>
      <span class="mem-layout-block data">2</span>
      <span class="mem-layout-block data">3</span>
      <span class="mem-layout-block data">4</span>
      <span class="mem-layout-block data">5</span>
      <span class="mem-layout-block data">6</span>
      <span class="mem-layout-block data">7</span>
      <span class="mem-layout-block freed">?</span>
      <span class="mem-layout-block freed">?</span>
      <span class="mem-layout-block freed">?</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
  <div class="mem-layout-note">Stack: 24 bytes (ptr + len + cap). Heap: capacity × size_of::&lt;T&gt;(). Elements beyond len are uninitialized.</div>
</div>

### Slice: View (no ownership)

**`let slice = &vec[1..5]; // [2, 3, 4, 5, 6]`**

<div class="mem-layout">
  <div class="mem-layout-row">
    <div class="mem-layout-label">vec: Vec&lt;i32&gt;</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr</span>
      <span class="mem-layout-block len">len: 7</span>
      <span class="mem-layout-block cap">cap: 10</span>
    </div>
    <span class="mem-layout-arrow">→</span>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block data">1</span>
      <span class="mem-layout-block val">2</span>
      <span class="mem-layout-block val">3</span>
      <span class="mem-layout-block val">4</span>
      <span class="mem-layout-block val">5</span>
      <span class="mem-layout-block val">6</span>
      <span class="mem-layout-block data">7</span>
      <span class="mem-layout-block freed">?</span>
      <span class="mem-layout-block freed">?</span>
      <span class="mem-layout-block freed">?</span>
    </div>
    <span class="mem-layout-heap-marker">(heap)</span>
  </div>
  <div class="mem-layout-row" style="margin-top: 8px;">
    <div class="mem-layout-label">slice: &amp;[i32]</div>
    <div class="mem-layout-blocks">
      <span class="mem-layout-block ptr">ptr ↗</span>
      <span class="mem-layout-block len">len: 5</span>
    </div>
    <span class="mem-layout-heap-marker">points to index 1..6 (highlighted above)</span>
  </div>
  <div class="mem-layout-note">Slice borrows a subrange of Vec's heap data. No copy, no allocation. 16 bytes on stack.</div>
</div>                  
                    
