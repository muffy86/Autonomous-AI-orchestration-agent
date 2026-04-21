# APK Analysis Tools

A comprehensive toolkit for analyzing, extracting, and understanding Android APK files, specifically optimized for React Native applications with AI/ML capabilities.

## 📦 What's Included

### 1. **APK Analyzer** (`apk-analyzer.py`)
Python-based comprehensive APK analysis tool that provides detailed insights into APK structure, dependencies, and capabilities.

### 2. **APK Extractor** (`apk-extractor.sh`)
Bash script for extracting specific resources from APKs including fonts, images, native libraries, and React Native bundles.

### 3. **Documentation**
- `APK_ANALYSIS_REPORT.md` - Detailed analysis report of the provided APK
- `APK_CAPABILITIES.md` - Comprehensive guide on what you can do with APKs
- `APK_TOOLS_README.md` - This file

## 🚀 Quick Start

### Analyze an APK
```bash
# Run full analysis
python3 apk-analyzer.py app-release.apk

# Save report to file
python3 apk-analyzer.py app-release.apk --output report.txt

# Generate JSON output
python3 apk-analyzer.py app-release.apk --format json
```

### Extract Resources
```bash
# Extract all resources
./apk-extractor.sh app-release.apk

# Extract to custom directory
./apk-extractor.sh app-release.apk my-output-dir
```

## 📊 Analysis Report Summary

The analyzed APK (`app-release.apk`) is a **React Native application** with the following characteristics:

### Key Findings

**Application Type**: React Native with on-device AI capabilities

**Size**: 137.44 MB total
- React Native bundle: 9.19 MB
- Native libraries: ~50 MB
- Resources & assets: ~3 MB
- Other files: ~75 MB

**AI/ML Capabilities**: 
- LLaMA language model support via GGML
- Multiple optimized builds for different ARM architectures
- Hexagon DSP acceleration for Qualcomm chips
- OpenCL support for GPU acceleration

**Architectures Supported**:
- ARM64-v8a (primary Android devices)
- x86_64 (Android emulators)

**Special Optimizations**:
- dotprod (ARM dot product instructions)
- i8mm (8-bit matrix multiplication)
- Hexagon DSP offloading
- OpenCL GPU acceleration

## 🔧 Tools Reference

### APK Analyzer

**Purpose**: Comprehensive APK analysis and reporting

**Features**:
- File structure analysis
- Native library detection and categorization
- Asset inventory
- React Native bundle analysis
- Metadata extraction
- Dependency detection
- Build information extraction

**Usage**:
```bash
python3 apk-analyzer.py <apk-file> [options]

Options:
  --format {text,json}  Output format (default: text)
  --output, -o FILE     Output file (default: stdout)

Examples:
  python3 apk-analyzer.py app.apk
  python3 apk-analyzer.py app.apk --format json > analysis.json
  python3 apk-analyzer.py app.apk -o report.txt
```

**Output Includes**:
- APK size and file count
- Directory structure
- File type distribution
- Native libraries by architecture
- Notable assets and their sizes
- React Native libraries detected
- Features detected (camera, location, ML, etc.)
- Build system information
- Kotlin/Java version info

### APK Extractor

**Purpose**: Extract specific resources for use in other projects

**Features**:
- Font extraction (TTF files)
- React Native bundle extraction
- String extraction from bundle
- Native library extraction
- Hexagon DSP library extraction
- Image resource extraction
- Metadata extraction

**Usage**:
```bash
./apk-extractor.sh <apk-file> [output-directory]

Examples:
  ./apk-extractor.sh app.apk
  ./apk-extractor.sh app.apk my-resources
```

**Extracted Resources**:
```
apk-resources/
├── fonts/              # TTF font files
├── bundle/             # React Native JavaScript bundle
│   ├── index.android.bundle
│   └── bundle-strings.txt
├── libraries/          # Native .so files (ARM64)
├── hexagon/            # Hexagon DSP libraries
├── images/             # PNG resources
├── metadata/           # JSON and .properties files
└── EXTRACTION_SUMMARY.txt
```

## 📚 Detailed Capabilities

### 1. Reverse Engineering

**Analyze JavaScript Bundle**:
```bash
# View the bundle
cat apk-resources/bundle/index.android.bundle | less

# Search for specific code
grep -i "function.*Model" apk-resources/bundle/bundle-strings.txt

# Find API endpoints
grep -E "https?://" apk-resources/bundle/bundle-strings.txt

# Extract imports/requires
grep -E "require\(|import.*from" apk-resources/bundle/bundle-strings.txt
```

**Analyze Native Libraries**:
```bash
# View library dependencies
readelf -d apk-resources/libraries/librnllama_v8.so

# Extract symbols
nm apk-resources/libraries/librnllama_v8.so | less

# Check library info
file apk-resources/libraries/*.so
```

### 2. Resource Extraction

**Use Extracted Fonts**:
```bash
# Copy to system fonts (Linux)
sudo cp apk-resources/fonts/*.ttf /usr/share/fonts/truetype/

# Use in projects
cp apk-resources/fonts/Inter-*.ttf /path/to/your/project/assets/fonts/
```

**Analyze Images**:
```bash
# View image sizes
du -h apk-resources/images/*.png | sort -rh

# Convert or optimize
for img in apk-resources/images/*.png; do
  convert "$img" -resize 50% "optimized_$(basename $img)"
done
```

### 3. Development Reference

**Study React Native Structure**:
- Bundle organization
- Library integration patterns
- Native module bridges
- Asset management
- Build optimization

**Learn GGML/LLaMA Integration**:
- How to package ML models
- Native library loading
- Hardware acceleration setup
- Multi-architecture builds

### 4. Testing & QA

**Install APK**:
```bash
# Install on connected device
adb install app-release.apk

# Install on specific device
adb -s <device-id> install app-release.apk

# Reinstall (preserve data)
adb install -r app-release.apk

# Uninstall
adb uninstall <package-name>
```

**Debug Installation**:
```bash
# View logcat during install
adb logcat | grep -i "package\|install"

# Check installed package
adb shell pm list packages | grep <package-name>

# Get package info
adb shell dumpsys package <package-name>
```

### 5. Performance Analysis

**Measure APK Size**:
```bash
# Total size
ls -lh app-release.apk

# Size by component
python3 apk-analyzer.py app-release.apk --format json | \
  jq '.structure.file_types'
```

**Analyze Bundle Size**:
```bash
# Bundle size
ls -lh apk-resources/bundle/index.android.bundle

# Identify large dependencies
grep -o "require('[^']*')" apk-resources/bundle/bundle-strings.txt | \
  sort | uniq -c | sort -rn
```

### 6. Security Analysis

**Search for Secrets**:
```bash
# API keys
grep -iE "api[_-]?key|apikey" apk-resources/bundle/bundle-strings.txt

# Tokens
grep -iE "token|secret|password" apk-resources/bundle/bundle-strings.txt

# URLs and endpoints
grep -oE "https?://[^\s\"']+" apk-resources/bundle/bundle-strings.txt | sort -u
```

**Check Permissions** (requires apktool):
```bash
# Decompile APK
apktool d app-release.apk

# View manifest
cat app-release/AndroidManifest.xml | grep -A 5 "uses-permission"
```

## 🎯 Use Cases

### For Developers

1. **Learning Resource**
   - Study professional React Native + native integration
   - Understand on-device AI implementation
   - Learn multi-architecture optimization
   - Analyze build configurations

2. **Reference Implementation**
   - Use as template for similar apps
   - Copy font and icon libraries
   - Study bundle structure
   - Learn optimization techniques

3. **Debugging**
   - Compare APK structures
   - Identify library conflicts
   - Analyze size issues
   - Verify build outputs

### For Researchers

1. **ML on Mobile**
   - Study GGML integration patterns
   - Analyze model packaging
   - Understand hardware acceleration
   - Performance optimization research

2. **App Architecture**
   - React Native patterns
   - Native module design
   - Asset management
   - Build system analysis

### For Security Analysts

1. **Static Analysis**
   - Code review via bundle analysis
   - Library vulnerability assessment
   - Permissions audit
   - Hardcoded secrets detection

2. **Dynamic Analysis**
   - Install and monitor behavior
   - Network traffic analysis
   - Storage and permissions
   - Runtime behavior

## 🔍 Advanced Analysis

### Examine Specific Features

**AI/ML Capabilities**:
```bash
# Find model-related code
grep -i "llama\|ggml\|inference\|model" apk-resources/bundle/bundle-strings.txt

# Check Hexagon support
ls -lh apk-resources/hexagon/

# View library optimizations
ls -1 apk-resources/libraries/librnllama*.so
```

**Camera Features**:
```bash
# Search for camera code
grep -i "camera\|photo\|video\|capture" apk-resources/bundle/bundle-strings.txt

# Check camera libraries
ls apk-resources/libraries/ | grep -i camera
```

**Authentication**:
```bash
# Find auth-related code
grep -iE "auth|login|biometric|fingerprint" apk-resources/bundle/bundle-strings.txt

# Check biometric libraries
cat apk-resources/metadata/*.properties | grep -i biometric
```

### Compare Multiple APKs

```bash
# Analyze multiple versions
for apk in *.apk; do
  echo "=== $apk ==="
  python3 apk-analyzer.py "$apk" --format json | \
    jq '{size: .structure.total_size_mb, files: .structure.total_files}'
done
```

### Generate Comparative Reports

```python
import json
import sys

# Load multiple analysis reports
reports = []
for file in ['v1-analysis.json', 'v2-analysis.json']:
    with open(file) as f:
        reports.append(json.load(f))

# Compare sizes
for i, report in enumerate(reports, 1):
    print(f"Version {i}:")
    print(f"  Total: {report['structure']['total_size_mb']} MB")
    print(f"  Bundle: {report['react_native']['size_mb']} MB")
```

## 📖 Additional Resources

### Documentation
- `APK_CAPABILITIES.md` - Comprehensive guide on APK capabilities
- `APK_ANALYSIS_REPORT.md` - Detailed report of analyzed APK

### External Tools
- **apktool** - APK decompilation and repackaging
- **jadx** - Dex to Java decompiler
- **dex2jar** - Convert DEX to JAR
- **Android Studio** - APK Analyzer built-in
- **ClassyShark** - APK/DEX browser

### Learning Resources
- React Native documentation
- GGML GitHub repository
- Android NDK documentation
- Hexagon SDK documentation

## ⚠️ Legal & Ethical Considerations

**Important Notes**:
1. Only analyze APKs you have permission to examine
2. Respect intellectual property and copyrights
3. Don't extract and reuse proprietary code or assets
4. Follow app store terms of service
5. Use for educational and research purposes
6. Don't reverse engineer to bypass security measures

**Appropriate Uses**:
- Learning and education
- Security research (with permission)
- Your own app analysis
- Academic research
- Compatibility testing

## 🛠️ Requirements

### Python Requirements
- Python 3.6+
- Standard library only (no external dependencies)

### System Requirements
- Linux, macOS, or Windows with WSL
- `unzip` command
- `file` command
- `strings` command

### Optional Tools
- `readelf` (for library analysis)
- `nm` (for symbol extraction)
- `adb` (for device testing)
- `apktool` (for decompilation)

## 📝 Contributing

To improve these tools:

1. **Add Features**
   - Support for more app types (Flutter, Xamarin)
   - Better deobfuscation
   - Automated security checks
   - Performance profiling

2. **Enhance Analysis**
   - Permission analysis
   - Network endpoint detection
   - Library vulnerability scanning
   - Size optimization suggestions

3. **Improve Documentation**
   - More examples
   - Video tutorials
   - Case studies
   - Troubleshooting guide

## 🐛 Troubleshooting

### Common Issues

**"APK file not found"**:
```bash
# Check file exists
ls -la *.apk

# Use full path
python3 apk-analyzer.py /full/path/to/app.apk
```

**"Permission denied" on extraction**:
```bash
# Make scripts executable
chmod +x apk-extractor.sh

# Check directory permissions
ls -ld .
```

**"Out of space" during extraction**:
```bash
# Check available space
df -h .

# Clean up old extractions
rm -rf *_extracted/
```

**Binary AndroidManifest.xml**:
```bash
# Use apktool to decompile
apktool d app-release.apk

# Read manifest
cat app-release/AndroidManifest.xml
```

## 📄 License

These tools are provided as-is for educational purposes. Use responsibly and ethically.

## 🤝 Support

For issues, questions, or contributions, please refer to the main repository documentation.

---

**Last Updated**: April 20, 2026
**Version**: 1.0.0
**Compatible With**: Android APKs (especially React Native apps)
