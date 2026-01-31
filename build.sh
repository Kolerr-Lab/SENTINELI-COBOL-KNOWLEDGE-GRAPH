#!/bin/bash
mkdir -p bin
echo "Compiling COBOL Programs..."

# Find all .cob files in src/ and compile them
find src -name "*.cob" | while read source_file; do
    filename=$(basename -- "$source_file")
    name="${filename%.*}"
    echo "Compiling $name..."
    # Suppress warnings if needed, -x for executable, -free for modern format
    cobc -x -free -o "bin/$name" "$source_file" || echo "Warning: Failed to compile $name"
done

echo "Compilation Complete."
