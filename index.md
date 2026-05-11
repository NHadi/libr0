# Introduction

Welcome to **libr0** - a hands-on journey through Rust's standard library types.

## What is libr0?

libr0 is an educational project that reimplements Rust's core standard library types from scratch. By building types like `Option`, `Box`, `Vec`, and `Rc` yourself, you'll develop a deep understanding of:

- Memory management and allocation
- Smart pointers and ownership patterns
- Interior mutability with `Cell` and `RefCell`
- Reference counting and weak references

## Who is this for?

This book is designed for developers who:

- Understand basic Rust syntax and ownership rules
- Want to understand how Rust's types work under the hood
- Learn best by building and experimenting with code
- Are curious about memory layout and low-level implementation details

## How to use this book

Each chapter covers one type in depth:

1. **What problem does it solve?** - Understanding the motivation
2. **How does it work?** - Implementation details with memory diagrams
3. **Build it yourself** - Runnable examples and exercises
4. **Common patterns** - Real-world usage scenarios

All implementations use the suffix `0` (e.g., `Option0<T>`, `Vec0<T>`) to distinguish them from stdlib types, allowing side-by-side comparison.

## Running the code

The complete source code is available at [github.com/NHadi/libr0](https://github.com/NHadi/libr0). You can:

```bash
# Run all tests
cargo test

# Run a specific chapter's examples
cargo run --example option
cargo run --example vec
cargo run --example rc
```

## Ready to dive in?

Start with [Chapter 1: Option](docs/01-option.md) to begin your journey.