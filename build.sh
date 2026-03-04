#!/bin/bash
# Build script for libr0 - creates custom landing page as index

# Build the book
mdbook build

# Save the generated Introduction page
mv book/index.html book/introduction.html

# Use our custom landing page as the index
cp theme/landing.html book/index.html

echo "✓ Book built successfully with custom landing page"
echo "  - Landing page: book/index.html"
echo "  - Introduction: book/introduction.html"