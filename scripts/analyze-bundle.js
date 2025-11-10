#!/usr/bin/env node

/**
 * Bundle analyzer script for the AI Chatbot application
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const BUNDLE_SIZE_LIMITS = {
  // First Load JS shared by all pages
  firstLoadJS: 128 * 1024, // 128KB
  // Individual page bundles
  pageBundle: 244 * 1024, // 244KB
  // Total bundle size warning threshold
  totalWarning: 512 * 1024, // 512KB
  // Total bundle size error threshold
  totalError: 1024 * 1024, // 1MB
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function analyzeBundle() {
  console.log('🔍 Analyzing bundle size...\n');
  
  try {
    // Build the application first
    console.log('Building application...');
    execSync('pnpm build', { stdio: 'inherit' });
    
    // Check if .next directory exists
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      console.error('❌ .next directory not found. Please run "pnpm build" first.');
      process.exit(1);
    }
    
    // Analyze static files
    const staticDir = path.join(nextDir, 'static');
    if (fs.existsSync(staticDir)) {
      analyzeStaticFiles(staticDir);
    }
    
    // Analyze server chunks
    const serverDir = path.join(nextDir, 'server');
    if (fs.existsSync(serverDir)) {
      analyzeServerFiles(serverDir);
    }
    
    // Generate recommendations
    generateRecommendations();
    
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

function analyzeStaticFiles(staticDir) {
  console.log('📦 Static Files Analysis:');
  console.log('========================\n');
  
  const chunks = [];
  
  function walkDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath, `${prefix + file}/`);
      } else if (file.endsWith('.js')) {
        const size = stat.size;
        const relativePath = prefix + file;
        chunks.push({ path: relativePath, size });
      }
    }
  }
  
  walkDir(staticDir);
  
  // Sort by size (largest first)
  chunks.sort((a, b) => b.size - a.size);
  
  let totalSize = 0;
  let firstLoadJS = 0;
  
  console.log('Largest JavaScript chunks:');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const sizeStr = formatBytes(chunk.size);
    const status = chunk.size > BUNDLE_SIZE_LIMITS.pageBundle ? '⚠️' : '✅';
    console.log(`${index + 1}. ${chunk.path} - ${sizeStr} ${status}`);
    
    totalSize += chunk.size;
    
    // Estimate first load JS (framework and main chunks)
    if (chunk.path.includes('framework') || chunk.path.includes('main') || chunk.path.includes('webpack')) {
      firstLoadJS += chunk.size;
    }
  });
  
  console.log(`\nTotal JavaScript size: ${formatBytes(totalSize)}`);
  console.log(`Estimated First Load JS: ${formatBytes(firstLoadJS)}`);
  
  // Check against limits
  if (firstLoadJS > BUNDLE_SIZE_LIMITS.firstLoadJS) {
    console.log(`⚠️  First Load JS exceeds recommended limit (${formatBytes(BUNDLE_SIZE_LIMITS.firstLoadJS)})`);
  } else {
    console.log(`✅ First Load JS within recommended limit`);
  }
  
  if (totalSize > BUNDLE_SIZE_LIMITS.totalError) {
    console.log(`❌ Total bundle size is very large (>${formatBytes(BUNDLE_SIZE_LIMITS.totalError)})`);
  } else if (totalSize > BUNDLE_SIZE_LIMITS.totalWarning) {
    console.log(`⚠️  Total bundle size is getting large (>${formatBytes(BUNDLE_SIZE_LIMITS.totalWarning)})`);
  } else {
    console.log(`✅ Total bundle size looks good`);
  }
  
  console.log('\n');
}

function analyzeServerFiles(serverDir) {
  console.log('🖥️  Server Files Analysis:');
  console.log('=========================\n');
  
  const serverFiles = [];
  
  function walkDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath, `${prefix + file}/`);
      } else if (file.endsWith('.js')) {
        const size = stat.size;
        const relativePath = prefix + file;
        serverFiles.push({ path: relativePath, size });
      }
    }
  }
  
  walkDir(serverDir);
  
  // Sort by size (largest first)
  serverFiles.sort((a, b) => b.size - a.size);
  
  let totalServerSize = 0;
  
  console.log('Largest server chunks:');
  serverFiles.slice(0, 5).forEach((file, index) => {
    const sizeStr = formatBytes(file.size);
    console.log(`${index + 1}. ${file.path} - ${sizeStr}`);
    totalServerSize += file.size;
  });
  
  console.log(`\nTotal server size: ${formatBytes(totalServerSize)}\n`);
}

function generateRecommendations() {
  console.log('💡 Optimization Recommendations:');
  console.log('================================\n');
  
  const recommendations = [
    '1. 📦 Code Splitting:',
    '   - Use dynamic imports for large components',
    '   - Implement route-based code splitting',
    '   - Split vendor libraries into separate chunks',
    '',
    '2. 🗜️  Bundle Optimization:',
    '   - Enable tree shaking for unused code',
    '   - Use webpack-bundle-analyzer for detailed analysis',
    '   - Consider using SWC minifier for better compression',
    '',
    '3. 📚 Library Optimization:',
    '   - Replace large libraries with smaller alternatives',
    '   - Use modular imports (e.g., import specific lodash functions)',
    '   - Consider using lighter AI SDK alternatives for specific use cases',
    '',
    '4. 🖼️  Asset Optimization:',
    '   - Optimize images with next/image',
    '   - Use WebP/AVIF formats for better compression',
    '   - Implement lazy loading for non-critical assets',
    '',
    '5. 🚀 Performance Monitoring:',
    '   - Set up bundle size monitoring in CI/CD',
    '   - Use Lighthouse CI for performance regression detection',
    '   - Monitor Core Web Vitals in production',
    '',
    '6. 🎯 Next.js Specific:',
    '   - Use experimental.optimizePackageImports',
    '   - Enable experimental.turbo for faster builds',
    '   - Consider using App Router for better optimization',
  ];
  
  recommendations.forEach(rec => console.log(rec));
  
  console.log('\n📊 To get detailed bundle analysis, run:');
  console.log('   pnpm add -D @next/bundle-analyzer');
  console.log('   ANALYZE=true pnpm build');
}

// Run the analyzer
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle, formatBytes };