# Chrome Flags for AI & Performance

Recommended Chrome flags for optimal AI development and browsing performance.

## How to Enable

1. Navigate to `chrome://flags`
2. Search for the flag name
3. Set to "Enabled"
4. Restart browser

## Performance Flags

### ⚡ Enable Parallel Downloading
**Flag**: `chrome://flags/#enable-parallel-downloading`
**Status**: ✅ Enabled
**Benefit**: Faster downloads by splitting into parallel streams

### ⚡ Enable QUIC Protocol
**Flag**: `chrome://flags/#enable-quic`
**Status**: ✅ Enabled
**Benefit**: Improved network performance

### ⚡ Enable GPU Rasterization
**Flag**: `chrome://flags/#enable-gpu-rasterization`
**Status**: ✅ Enabled
**Benefit**: Faster page rendering

### ⚡ Enable Zero-Copy Rasterizer
**Flag**: `chrome://flags/#enable-zero-copy`
**Status**: ✅ Enabled
**Benefit**: Reduced memory usage

## AI & WebGPU Flags

### 🤖 Enable WebGPU
**Flag**: `chrome://flags/#enable-webgpu`
**Status**: ✅ Enabled
**Benefit**: Run AI models locally in browser (TensorFlow.js, ONNX)

### 🤖 Enable WebAssembly Lazy Compilation
**Flag**: `chrome://flags/#enable-webassembly-lazy-compilation`
**Status**: ✅ Enabled
**Benefit**: Faster WASM startup (used by many AI libraries)

### 🤖 Enable WebAssembly Baseline Compiler
**Flag**: `chrome://flags/#enable-webassembly-baseline`
**Status**: ✅ Enabled
**Benefit**: Better WASM performance

### 🤖 Enable Experimental Web Platform Features
**Flag**: `chrome://flags/#enable-experimental-web-platform-features`
**Status**: ✅ Enabled
**Benefit**: Access to cutting-edge browser APIs

## Developer Flags

### 🔧 Enable DevTools Experiments
**Flag**: `chrome://flags/#enable-devtools-experiments`
**Status**: ✅ Enabled
**Benefit**: Access experimental DevTools features

### 🔧 Enable JavaScript Harmony
**Flag**: `chrome://flags/#enable-javascript-harmony`
**Status**: ✅ Enabled
**Benefit**: Latest JavaScript features

### 🔧 Enable Experimental Extension APIs
**Flag**: `chrome://flags/#enable-experimental-extension-apis`
**Status**: ✅ Enabled (if building extensions)
**Benefit**: Access to new extension capabilities

## Privacy & Security

### 🔒 Enable Strict Site Isolation
**Flag**: `chrome://flags/#enable-site-per-process`
**Status**: ✅ Enabled
**Benefit**: Better security against attacks

### 🔒 Enable HTTPS-Only Mode
**Flag**: `chrome://flags/#https-only-mode-setting`
**Status**: ✅ Enabled
**Benefit**: Force HTTPS connections

### 🔒 Enable DNS over HTTPS
**Flag**: `chrome://flags/#dns-over-https`
**Status**: ✅ Enabled
**Benefit**: Encrypted DNS queries

## UI & UX

### 🎨 Enable Smooth Scrolling
**Flag**: `chrome://flags/#smooth-scrolling`
**Status**: ✅ Enabled
**Benefit**: Smoother page scrolling

### 🎨 Enable Tab Groups Save/Recall
**Flag**: `chrome://flags/#tab-groups-save`
**Status**: ✅ Enabled
**Benefit**: Save and restore tab groups

### 🎨 Enable Tab Search
**Flag**: `chrome://flags/#enable-tab-search`
**Status**: ✅ Enabled
**Benefit**: Quick tab finding

## Memory Management

### 💾 Enable Back-Forward Cache
**Flag**: `chrome://flags/#back-forward-cache`
**Status**: ✅ Enabled
**Benefit**: Instant back/forward navigation

### 💾 Enable Lazy Frame Loading
**Flag**: `chrome://flags/#enable-lazy-frame-loading`
**Status**: ✅ Enabled
**Benefit**: Faster initial page load

### 💾 Enable Lazy Image Loading
**Flag**: `chrome://flags/#enable-lazy-image-loading`
**Status**: ✅ Enabled
**Benefit**: Load images on scroll

## Optional/Experimental

### 🧪 Enable Reader Mode
**Flag**: `chrome://flags/#enable-reader-mode`
**Status**: ⚠️ Optional
**Benefit**: Clean reading experience

### 🧪 Enable Force Dark Mode
**Flag**: `chrome://flags/#enable-force-dark`
**Status**: ⚠️ Optional (may break some sites)
**Benefit**: Dark mode for all websites

### 🧪 Enable Tab Freeze
**Flag**: `chrome://flags/#proactive-tab-freeze-and-discard`
**Status**: ⚠️ Optional
**Benefit**: Reduce memory for background tabs

## Flags to DISABLE

### ❌ Disable AutoPlay
**Flag**: `chrome://flags/#autoplay-policy`
**Status**: ❌ Set to "Document user activation is required"
**Benefit**: Prevent annoying auto-playing videos

### ❌ Disable FLoC
**Flag**: `chrome://flags/#privacy-sandbox-ads-apis`
**Status**: ❌ Disabled
**Benefit**: Better privacy (disable ad tracking)

## Quick Copy Commands

Enable all recommended flags at once (paste in terminal):

```bash
# Linux/Mac
google-chrome \
  --enable-features=ParallelDownloading,Quic,WebGPU,WebAssemblyLazyCompilation \
  --enable-gpu-rasterization \
  --enable-zero-copy

# Windows (PowerShell)
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --enable-features=ParallelDownloading,Quic,WebGPU,WebAssemblyLazyCompilation `
  --enable-gpu-rasterization `
  --enable-zero-copy
```

## Verification

Check if WebGPU is working:

1. Open DevTools Console (F12)
2. Run:

```javascript
(async () => {
    if ('gpu' in navigator) {
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        console.log('✅ WebGPU is available!', device);
    } else {
        console.log('❌ WebGPU not supported');
    }
})();
```

## Troubleshooting

### If browser becomes unstable:
1. Go to `chrome://flags`
2. Click "Reset all to default"
3. Restart browser
4. Enable flags one by one to identify the problematic one

### Check GPU status:
Visit `chrome://gpu/` to see GPU acceleration status

### Monitor performance:
Visit `chrome://memory-redirect/` to check memory usage

---

**Note**: Flags are experimental and may change or be removed in future Chrome versions. Review periodically.

**Last Updated**: March 2026
