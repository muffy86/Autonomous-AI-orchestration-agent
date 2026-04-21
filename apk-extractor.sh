#!/bin/bash
# APK Extraction and Resource Helper
# Extracts specific resources from the analyzed APK

set -e

APK_FILE="${1:-app-release.apk}"
OUTPUT_DIR="${2:-apk-resources}"

if [ ! -f "$APK_FILE" ]; then
    echo "Error: APK file not found: $APK_FILE"
    echo "Usage: $0 <apk-file> [output-dir]"
    exit 1
fi

EXTRACT_DIR="${APK_FILE%.apk}_extracted"

echo "=========================================="
echo "APK Resource Extractor"
echo "=========================================="
echo "APK: $APK_FILE"
echo "Output: $OUTPUT_DIR"
echo ""

# Create output directories
mkdir -p "$OUTPUT_DIR"/{fonts,images,libraries,bundle,metadata,hexagon}

echo "📦 Extracting APK (if needed)..."
if [ ! -d "$EXTRACT_DIR" ]; then
    unzip -q "$APK_FILE" -d "$EXTRACT_DIR"
    echo "✓ Extracted to $EXTRACT_DIR"
else
    echo "✓ Using existing extraction: $EXTRACT_DIR"
fi

# Extract fonts
echo ""
echo "🔤 Extracting fonts..."
if [ -d "$EXTRACT_DIR/assets/fonts" ]; then
    cp "$EXTRACT_DIR"/assets/fonts/*.ttf "$OUTPUT_DIR/fonts/" 2>/dev/null || true
    FONT_COUNT=$(ls -1 "$OUTPUT_DIR/fonts/" 2>/dev/null | wc -l)
    echo "✓ Extracted $FONT_COUNT fonts to $OUTPUT_DIR/fonts/"
fi

# Extract React Native bundle
echo ""
echo "⚛️  Extracting React Native bundle..."
if [ -f "$EXTRACT_DIR/assets/index.android.bundle" ]; then
    cp "$EXTRACT_DIR/assets/index.android.bundle" "$OUTPUT_DIR/bundle/"
    BUNDLE_SIZE=$(du -h "$OUTPUT_DIR/bundle/index.android.bundle" | cut -f1)
    echo "✓ Extracted bundle ($BUNDLE_SIZE) to $OUTPUT_DIR/bundle/"
    
    # Extract readable strings from bundle
    echo "  → Extracting strings from bundle..."
    strings "$OUTPUT_DIR/bundle/index.android.bundle" > "$OUTPUT_DIR/bundle/bundle-strings.txt"
    STRING_COUNT=$(wc -l < "$OUTPUT_DIR/bundle/bundle-strings.txt")
    echo "  ✓ Extracted $STRING_COUNT strings to bundle-strings.txt"
fi

# Extract Hexagon DSP libraries
echo ""
echo "🔧 Extracting Hexagon DSP libraries..."
if [ -d "$EXTRACT_DIR/assets/ggml-hexagon" ]; then
    cp "$EXTRACT_DIR"/assets/ggml-hexagon/*.so "$OUTPUT_DIR/hexagon/" 2>/dev/null || true
    HEXAGON_COUNT=$(ls -1 "$OUTPUT_DIR/hexagon/" 2>/dev/null | wc -l)
    echo "✓ Extracted $HEXAGON_COUNT Hexagon libraries to $OUTPUT_DIR/hexagon/"
fi

# Extract native libraries (ARM64)
echo ""
echo "📚 Extracting native libraries (arm64-v8a)..."
if [ -d "$EXTRACT_DIR/lib/arm64-v8a" ]; then
    cp "$EXTRACT_DIR"/lib/arm64-v8a/*.so "$OUTPUT_DIR/libraries/" 2>/dev/null || true
    LIB_COUNT=$(ls -1 "$OUTPUT_DIR/libraries/" 2>/dev/null | wc -l)
    echo "✓ Extracted $LIB_COUNT native libraries to $OUTPUT_DIR/libraries/"
    
    # List largest libraries
    echo "  Top 5 largest libraries:"
    du -h "$OUTPUT_DIR/libraries"/*.so | sort -rh | head -5 | sed 's/^/    /'
fi

# Extract images
echo ""
echo "🖼️  Extracting images..."
if [ -d "$EXTRACT_DIR/res" ]; then
    find "$EXTRACT_DIR/res" -name "*.png" -exec cp {} "$OUTPUT_DIR/images/" \; 2>/dev/null || true
    IMG_COUNT=$(ls -1 "$OUTPUT_DIR/images/" 2>/dev/null | wc -l)
    echo "✓ Extracted $IMG_COUNT images to $OUTPUT_DIR/images/"
fi

# Extract metadata
echo ""
echo "📋 Extracting metadata..."
if [ -f "$EXTRACT_DIR/kotlin-tooling-metadata.json" ]; then
    cp "$EXTRACT_DIR/kotlin-tooling-metadata.json" "$OUTPUT_DIR/metadata/"
    echo "✓ Copied kotlin-tooling-metadata.json"
fi

find "$EXTRACT_DIR" -maxdepth 1 -name "*.properties" -exec cp {} "$OUTPUT_DIR/metadata/" \; 2>/dev/null || true
PROP_COUNT=$(ls -1 "$OUTPUT_DIR/metadata"/*.properties 2>/dev/null | wc -l)
echo "✓ Copied $PROP_COUNT property files"

# Generate summary
echo ""
echo "=========================================="
echo "📊 EXTRACTION SUMMARY"
echo "=========================================="

cat > "$OUTPUT_DIR/EXTRACTION_SUMMARY.txt" << EOF
APK Resource Extraction Summary
Generated: $(date)
Source APK: $APK_FILE

EXTRACTED RESOURCES:
-------------------
Fonts: $(ls -1 "$OUTPUT_DIR/fonts/" 2>/dev/null | wc -l) files
  Location: $OUTPUT_DIR/fonts/

React Native Bundle: $(if [ -f "$OUTPUT_DIR/bundle/index.android.bundle" ]; then echo "✓"; else echo "✗"; fi)
  Location: $OUTPUT_DIR/bundle/
  Size: $(du -h "$OUTPUT_DIR/bundle/index.android.bundle" 2>/dev/null | cut -f1 || echo "N/A")
  Strings extracted: $(wc -l < "$OUTPUT_DIR/bundle/bundle-strings.txt" 2>/dev/null || echo "0")

Native Libraries (ARM64): $(ls -1 "$OUTPUT_DIR/libraries/" 2>/dev/null | wc -l) files
  Location: $OUTPUT_DIR/libraries/

Hexagon DSP Libraries: $(ls -1 "$OUTPUT_DIR/hexagon/" 2>/dev/null | wc -l) files
  Location: $OUTPUT_DIR/hexagon/

Images: $(ls -1 "$OUTPUT_DIR/images/" 2>/dev/null | wc -l) files
  Location: $OUTPUT_DIR/images/

Metadata: $(ls -1 "$OUTPUT_DIR/metadata/" 2>/dev/null | wc -l) files
  Location: $OUTPUT_DIR/metadata/

USAGE:
------
1. Fonts are ready to use (.ttf files)
2. Bundle can be analyzed for JavaScript code
3. Libraries can be examined with: readelf, nm, objdump
4. Hexagon libraries are for Qualcomm Snapdragon DSP
5. Images can be used for UI analysis
6. Metadata contains build and version info

NEXT STEPS:
-----------
- Analyze bundle: cat $OUTPUT_DIR/bundle/index.android.bundle
- Search strings: grep -i "keyword" $OUTPUT_DIR/bundle/bundle-strings.txt
- Check libraries: ls -lh $OUTPUT_DIR/libraries/
- View metadata: cat $OUTPUT_DIR/metadata/*.json
EOF

cat "$OUTPUT_DIR/EXTRACTION_SUMMARY.txt"

echo ""
echo "✓ Summary saved to $OUTPUT_DIR/EXTRACTION_SUMMARY.txt"
echo ""
echo "=========================================="
echo "✨ Extraction complete!"
echo "=========================================="
