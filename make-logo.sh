#!/bin/bash

# Install ImageMagick using Homebrew if not already installed
if ! command -v magick &> /dev/null
then
    echo "ImageMagick not found. Installing..."
    brew install imagemagick
fi

# Check if an input file was provided
if [ $# -eq 0 ]; then
    echo "Please provide an input PNG file."
    exit 1
fi

input_file=$1

# Create the output directory if it doesn't exist
output_dir="public/icon"
mkdir -p "$output_dir"

# Array of desired sizes
sizes=(16 32 48 96 128)

# Determine whether to use 'magick' or 'convert'
if command -v magick &> /dev/null
then
    CONVERT_CMD="magick"
else
    CONVERT_CMD="convert"
fi

# Convert the image to different sizes
for size in "${sizes[@]}"
do
    output_file="${output_dir}/${size}.png"
    $CONVERT_CMD "$input_file" -resize ${size}x${size} "$output_file"
    echo "Created $output_file"
done

echo "Conversion complete! Images saved in $output_dir"

