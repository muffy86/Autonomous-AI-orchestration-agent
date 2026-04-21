# 🚀 Quick Start Guide - APK Analysis

## TL;DR - What Can You Do?

With the provided `app-release.apk` (137 MB React Native app with on-device AI):

### 🎯 Instant Analysis
```bash
python3 apk-analyzer.py app-release.apk
```
**Result**: Comprehensive report showing structure, libraries, features, and capabilities.

### 📦 Extract Everything
```bash
./apk-extractor.sh app-release.apk
```
**Result**: Extracts fonts, images, React Native bundle, native libraries, and more to `apk-resources/`

### 📱 Install & Test
```bash
adb install app-release.apk
```
**Result**: App installed on connected Android device or emulator.

---

## 🔥 Top 5 Things to Try

### 1. **Get the Full Analysis** (30 seconds)
```bash
python3 apk-analyzer.py app-release.apk --output full-report.txt
cat full-report.txt
```
**What you get**:
- App type (React Native)
- Total size breakdown
- Native libraries (LLaMA/GGML for AI)
- Detected features (camera, ML, auth, etc.)
- Build information

### 2. **Extract All Resources** (1 minute)
```bash
./apk-extractor.sh app-release.apk
ls -R apk-resources/
```
**What you get**:
- 9 professional fonts (Inter family, Material Icons)
- 9.2 MB React Native JavaScript bundle
- 37 native libraries (including 5 LLaMA variants)
- 5 Hexagon DSP libraries (for Qualcomm chips)
- 257 PNG images
- 34,082 extracted strings from bundle

### 3. **Explore the AI Capabilities** (5 minutes)
```bash
# Check LLaMA libraries
ls -lh apk-resources/libraries/librnllama*.so

# View Hexagon DSP support (hardware acceleration)
ls apk-resources/hexagon/

# Find AI-related code in bundle
grep -i "llama\|ggml\|inference\|model" apk-resources/bundle/bundle-strings.txt | head -20
```
**What you discover**:
- Multiple optimized LLaMA builds (8.9 MB each)
- Support for ARM dotprod, i8mm instructions
- Hexagon DSP + OpenCL acceleration
- On-device AI inference capabilities

### 4. **Analyze the React Native App** (5 minutes)
```bash
# Check bundle size
ls -lh apk-resources/bundle/index.android.bundle

# Find API endpoints
grep -oE "https?://[^\s\"']+" apk-resources/bundle/bundle-strings.txt | sort -u

# Discover libraries
grep -i "react-native\|expo\|navigation" apk-resources/bundle/bundle-strings.txt | head -10

# Search for features
grep -iE "camera|photo|location|biometric" apk-resources/bundle/bundle-strings.txt | wc -l
```
**What you find**:
- React Navigation
- Expo modules
- Camera integration
- Location services
- Biometric authentication
- ML Kit barcode scanning

### 5. **Use the Extracted Fonts** (2 minutes)
```bash
# Copy fonts to your project
cp apk-resources/fonts/Inter-*.ttf ~/my-project/fonts/

# Or install system-wide (Linux)
sudo cp apk-resources/fonts/*.ttf /usr/share/fonts/truetype/
sudo fc-cache -f -v

# View available fonts
ls apk-resources/fonts/
```
**What you get**:
- Inter (9 weights: Thin to ExtraBold)
- Material Icons (840+ icons)
- Material Community Icons (6,000+ icons)

---

## 🎨 Common Use Cases

### For Developers

**Study the Build Structure**:
```bash
# Get build info
cat apk-resources/metadata/kotlin-tooling-metadata.json

# Check dependencies
cat apk-resources/metadata/*.properties | head -20

# View AndroidX versions
ls app-release_extracted/META-INF/*.version | head -10
```

**Reference for Your App**:
- See how to integrate GGML/LLaMA in React Native
- Learn multi-architecture builds (ARM64, x86_64)
- Understand hardware acceleration setup
- Study bundle optimization (9.2 MB for full app)

### For Researchers

**Analyze ML Implementation**:
```bash
# Compare library sizes
du -h apk-resources/libraries/librnllama*.so

# Check optimization variants
ls apk-resources/libraries/ | grep llama

# Examine Hexagon DSP support
file apk-resources/hexagon/*.so
```

**Study Performance Optimizations**:
- dotprod (ARM dot product instructions)
- i8mm (8-bit matrix multiplication)
- Hexagon DSP offloading
- OpenCL GPU acceleration

### For Security Analysts

**Quick Security Scan**:
```bash
# Search for API keys
grep -iE "api[_-]?key|apikey" apk-resources/bundle/bundle-strings.txt

# Find hardcoded secrets
grep -iE "token|secret|password" apk-resources/bundle/bundle-strings.txt

# List all URLs
grep -oE "https?://[^\s\"']+" apk-resources/bundle/bundle-strings.txt | sort -u

# Check for common vulnerabilities
grep -i "eval\|dangerous\|unsafe" apk-resources/bundle/bundle-strings.txt
```

### For Designers

**Extract UI Resources**:
```bash
# Get all images
ls apk-resources/images/ | wc -l  # 257 images

# Find largest images
du -h apk-resources/images/*.png | sort -rh | head -10

# Get fonts
ls -lh apk-resources/fonts/
```

---

## 🧪 Testing & Installation

### Install on Device
```bash
# 1. Connect device via USB
adb devices

# 2. Install APK
adb install app-release.apk

# 3. Launch (need package name)
# Find package name first:
aapt dump badging app-release.apk | grep package:\ name

# Or use apktool:
apktool d app-release.apk
grep package app-release/AndroidManifest.xml
```

### Install on Emulator
```bash
# 1. Start emulator
emulator -avd Pixel_4_API_30 &

# 2. Wait for boot
adb wait-for-device

# 3. Install
adb install app-release.apk

# 4. View logs
adb logcat | grep -i "llama\|ggml"
```

---

## 📊 Understanding the Analysis

### What Does This APK Contain?

**App Type**: React Native
- Built with Gradle 9.0.0
- Kotlin 2.1.20
- React Native with Hermes engine

**Size Breakdown**:
- Total: 137.44 MB
- JavaScript bundle: 9.19 MB
- Native libraries: ~50 MB (multiple architectures)
- Resources: ~3 MB (fonts, images)
- Other: ~75 MB (framework, dependencies)

**Key Features**:
- ✅ On-device AI (LLaMA via GGML)
- ✅ Camera & video support
- ✅ Location services
- ✅ Biometric authentication
- ✅ Barcode scanning (ML Kit)
- ✅ Local storage (Room database)
- ✅ Networking & API calls

**Architectures**:
- ARM64-v8a (phones & tablets)
- x86_64 (emulators)

**Special Optimizations**:
- 5 different LLaMA builds for different ARM features
- Hexagon DSP libraries for Qualcomm Snapdragon
- OpenCL support for GPU acceleration

---

## 🔍 Deep Dive Commands

### Bundle Analysis
```bash
# Bundle size
ls -lh apk-resources/bundle/index.android.bundle
# Output: 9.2M

# Extract readable code (limited due to minification)
cat apk-resources/bundle/index.android.bundle | head -100

# Search strings
grep -i "keyword" apk-resources/bundle/bundle-strings.txt

# Count features
echo "Camera references: $(grep -ci camera apk-resources/bundle/bundle-strings.txt)"
echo "ML references: $(grep -ci "machine learning\|inference" apk-resources/bundle/bundle-strings.txt)"
echo "Auth references: $(grep -ci "auth\|login" apk-resources/bundle/bundle-strings.txt)"
```

### Library Analysis
```bash
# List all libraries
ls -lh apk-resources/libraries/

# Check library type
file apk-resources/libraries/librnllama_v8.so
# Output: ELF 64-bit LSB shared object, ARM aarch64

# View symbols (if not stripped)
nm apk-resources/libraries/librnllama_v8.so | head

# Check dependencies
readelf -d apk-resources/libraries/librnllama_v8.so | grep NEEDED
```

### Metadata Analysis
```bash
# Build system info
cat apk-resources/metadata/kotlin-tooling-metadata.json | jq

# Property files
cat apk-resources/metadata/*.properties

# AndroidX versions
cat app-release_extracted/META-INF/androidx.core_core.version
```

---

## 💡 Pro Tips

### 1. **Generate JSON for Automation**
```bash
python3 apk-analyzer.py app-release.apk --format json > analysis.json
cat analysis.json | jq '.react_native.detected_libraries'
```

### 2. **Compare APK Versions**
```bash
# Analyze both versions
python3 apk-analyzer.py app-v1.apk --format json > v1.json
python3 apk-analyzer.py app-v2.apk --format json > v2.json

# Compare sizes
echo "v1: $(jq .structure.total_size_mb v1.json) MB"
echo "v2: $(jq .structure.total_size_mb v2.json) MB"
```

### 3. **Extract Only What You Need**
```bash
# Just fonts
cp app-release_extracted/assets/fonts/*.ttf ~/fonts/

# Just the bundle
cp app-release_extracted/assets/index.android.bundle ~/analyze/

# Just one library
cp app-release_extracted/lib/arm64-v8a/librnllama_v8.so ~/libs/
```

### 4. **Search for Specific Code**
```bash
# Find all function definitions
grep -o "function [a-zA-Z_][a-zA-Z0-9_]*" apk-resources/bundle/bundle-strings.txt | sort -u

# Find imports
grep -o "import.*from" apk-resources/bundle/bundle-strings.txt

# Find specific library usage
grep -i "llama\|ggml" apk-resources/bundle/bundle-strings.txt | less
```

### 5. **Document Your Findings**
```bash
# Create comprehensive report
{
  echo "# My APK Analysis"
  echo "## Basic Info"
  python3 apk-analyzer.py app-release.apk
  echo "## Strings Sample"
  head -100 apk-resources/bundle/bundle-strings.txt
  echo "## Libraries"
  ls -lh apk-resources/libraries/
} > my-analysis.md
```

---

## ❓ FAQ

**Q: Can I modify and repackage the APK?**
A: Technically yes (using apktool), but respect intellectual property laws and app store terms.

**Q: Is the JavaScript bundle readable?**
A: Partially. It's minified but not obfuscated. Strings are extractable.

**Q: What is Hexagon DSP?**
A: Qualcomm's specialized processor for AI/ML acceleration. The APK includes libraries for it.

**Q: Can I run this on iOS?**
A: No, this is an Android APK. iOS uses .ipa files.

**Q: Why are there multiple LLaMA libraries?**
A: Different ARM CPU features. The app selects the best one at runtime.

**Q: Is it safe to install?**
A: Only install APKs from trusted sources. This one appears to be a legitimate AI chat app.

---

## 📚 Next Steps

1. **Read Full Docs**: See `APK_CAPABILITIES.md` for comprehensive guide
2. **Study the Report**: Check `APK_ANALYSIS_REPORT.md` for detailed findings
3. **Explore Tools**: Read `APK_TOOLS_README.md` for advanced usage
4. **Test the App**: Install and try it out
5. **Learn More**: Study React Native, GGML, and on-device AI

---

**Need Help?** Check the troubleshooting section in `APK_TOOLS_README.md`

**Want More?** See `APK_CAPABILITIES.md` for 50+ use cases and examples
