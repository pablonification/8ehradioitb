#!/bin/bash

# Script to generate PNG images from PlantUML files
# Make sure PlantUML is installed: https://plantuml.com/download

echo "Generating PNG images from PlantUML files..."

# Create images directory if it doesn't exist
mkdir -p images

# Generate images from PlantUML files
echo "Generating use case diagram..."
plantuml -tpng use-case-diagram.puml -o images/

echo "Generating class diagram..."
plantuml -tpng class-diagram.puml -o images/

echo "Generating sequence diagrams..."
for file in sequence-*.puml; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        plantuml -tpng "$file" -o images/
    fi
done

echo "All images generated successfully!"
echo "Images are saved in the 'images' directory"
echo ""
echo "To compile the LaTeX document:"
echo "pdflatex docs/system-documentation.tex"
echo "pdflatex docs/system-documentation.tex  # Run twice for TOC"
