#!/usr/bin/env python3
"""
APK Analysis Tool
Extracts and analyzes Android APK files to understand their structure,
dependencies, and capabilities.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional


class APKAnalyzer:
    """Comprehensive APK analysis tool."""
    
    def __init__(self, apk_path: str):
        """Initialize the analyzer with an APK file path."""
        self.apk_path = Path(apk_path)
        if not self.apk_path.exists():
            raise FileNotFoundError(f"APK file not found: {apk_path}")
        
        self.extract_dir = self.apk_path.parent / f"{self.apk_path.stem}_extracted"
        self.analysis_results = {}
    
    def extract_apk(self) -> Path:
        """Extract APK contents to a directory."""
        if self.extract_dir.exists():
            print(f"Using existing extraction: {self.extract_dir}")
            return self.extract_dir
        
        print(f"Extracting APK to {self.extract_dir}...")
        self.extract_dir.mkdir(exist_ok=True)
        
        with zipfile.ZipFile(self.apk_path, 'r') as zip_ref:
            zip_ref.extractall(self.extract_dir)
        
        print(f"✓ Extracted {len(list(self.extract_dir.rglob('*')))} files")
        return self.extract_dir
    
    def analyze_structure(self) -> Dict:
        """Analyze the APK file structure."""
        print("\n📁 Analyzing file structure...")
        
        structure = {
            'total_files': 0,
            'total_size_mb': round(self.apk_path.stat().st_size / 1024 / 1024, 2),
            'file_types': defaultdict(int),
            'directories': []
        }
        
        for item in self.extract_dir.rglob('*'):
            if item.is_file():
                structure['total_files'] += 1
                ext = item.suffix.lower() or 'no_extension'
                structure['file_types'][ext] += 1
            elif item.is_dir():
                rel_path = item.relative_to(self.extract_dir)
                if len(rel_path.parts) == 1:  # Top-level directories only
                    structure['directories'].append(str(rel_path))
        
        structure['file_types'] = dict(sorted(structure['file_types'].items(), 
                                              key=lambda x: x[1], reverse=True))
        
        self.analysis_results['structure'] = structure
        return structure
    
    def analyze_native_libraries(self) -> Dict:
        """Analyze native libraries (.so files)."""
        print("\n🔧 Analyzing native libraries...")
        
        lib_dir = self.extract_dir / 'lib'
        if not lib_dir.exists():
            return {'found': False}
        
        libraries = {
            'found': True,
            'architectures': [],
            'libraries_by_arch': {}
        }
        
        for arch_dir in lib_dir.iterdir():
            if arch_dir.is_dir():
                arch = arch_dir.name
                libraries['architectures'].append(arch)
                libs = []
                
                for lib_file in arch_dir.glob('*.so'):
                    size_mb = round(lib_file.stat().st_size / 1024 / 1024, 3)
                    libs.append({
                        'name': lib_file.name,
                        'size_mb': size_mb
                    })
                
                libraries['libraries_by_arch'][arch] = sorted(libs, 
                                                              key=lambda x: x['size_mb'], 
                                                              reverse=True)
        
        self.analysis_results['native_libraries'] = libraries
        return libraries
    
    def analyze_assets(self) -> Dict:
        """Analyze assets directory."""
        print("\n📦 Analyzing assets...")
        
        assets_dir = self.extract_dir / 'assets'
        if not assets_dir.exists():
            return {'found': False}
        
        assets = {
            'found': True,
            'files': [],
            'notable_files': []
        }
        
        notable_patterns = [
            r'\.bundle$',
            r'\.model$',
            r'\.bin$',
            r'\.json$',
            r'\.db$',
            r'\.ttf$',
            r'\.otf$'
        ]
        
        for asset_file in assets_dir.rglob('*'):
            if asset_file.is_file():
                rel_path = asset_file.relative_to(assets_dir)
                size_mb = round(asset_file.stat().st_size / 1024 / 1024, 3)
                
                file_info = {
                    'path': str(rel_path),
                    'size_mb': size_mb
                }
                
                assets['files'].append(file_info)
                
                # Check for notable files
                if any(re.search(pattern, str(rel_path), re.IGNORECASE) 
                       for pattern in notable_patterns):
                    assets['notable_files'].append(file_info)
        
        # Sort by size
        assets['files'] = sorted(assets['files'], key=lambda x: x['size_mb'], reverse=True)
        assets['notable_files'] = sorted(assets['notable_files'], 
                                         key=lambda x: x['size_mb'], reverse=True)
        
        self.analysis_results['assets'] = assets
        return assets
    
    def analyze_metadata(self) -> Dict:
        """Analyze metadata files."""
        print("\n📋 Analyzing metadata...")
        
        metadata = {
            'kotlin_tooling': None,
            'androidx_versions': {},
            'properties': {}
        }
        
        # Kotlin metadata
        kotlin_meta = self.extract_dir / 'kotlin-tooling-metadata.json'
        if kotlin_meta.exists():
            with open(kotlin_meta, 'r') as f:
                metadata['kotlin_tooling'] = json.load(f)
        
        # Property files
        for prop_file in self.extract_dir.glob('*.properties'):
            with open(prop_file, 'r') as f:
                metadata['properties'][prop_file.name] = f.read().strip()
        
        # AndroidX versions
        meta_inf = self.extract_dir / 'META-INF'
        if meta_inf.exists():
            for version_file in meta_inf.glob('*.version'):
                with open(version_file, 'r') as f:
                    metadata['androidx_versions'][version_file.name] = f.read().strip()
        
        self.analysis_results['metadata'] = metadata
        return metadata
    
    def analyze_react_native_bundle(self) -> Optional[Dict]:
        """Analyze React Native bundle if present."""
        print("\n⚛️  Analyzing React Native bundle...")
        
        bundle_path = self.extract_dir / 'assets' / 'index.android.bundle'
        if not bundle_path.exists():
            return None
        
        bundle_info = {
            'found': True,
            'size_mb': round(bundle_path.stat().st_size / 1024 / 1024, 2),
            'detected_libraries': [],
            'detected_features': []
        }
        
        # Read bundle content
        try:
            with open(bundle_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Detect common libraries
            libraries = [
                'react-native',
                'react-navigation',
                '@react-native-community',
                'react-native-screens',
                'react-native-gesture-handler',
                'react-native-svg',
                'react-native-camera',
                'expo',
                'llama',
                'ggml',
                'tensorflow',
                'ml-kit'
            ]
            
            for lib in libraries:
                if lib in content.lower():
                    bundle_info['detected_libraries'].append(lib)
            
            # Detect features
            features = {
                'camera': r'camera|photo|video',
                'location': r'location|gps|geolocation',
                'ml': r'machine learning|ml|inference|model',
                'storage': r'asyncstorage|sqlite|realm',
                'authentication': r'auth|login|biometric',
                'networking': r'fetch|axios|http'
            }
            
            for feature, pattern in features.items():
                if re.search(pattern, content, re.IGNORECASE):
                    bundle_info['detected_features'].append(feature)
        
        except Exception as e:
            bundle_info['error'] = str(e)
        
        self.analysis_results['react_native'] = bundle_info
        return bundle_info
    
    def detect_app_type(self) -> str:
        """Detect the type of application."""
        
        # Check for React Native
        if (self.extract_dir / 'assets' / 'index.android.bundle').exists():
            return 'React Native'
        
        # Check for Flutter
        if (self.extract_dir / 'assets' / 'flutter_assets').exists():
            return 'Flutter'
        
        # Check for Cordova/Ionic
        if (self.extract_dir / 'assets' / 'www').exists():
            return 'Cordova/Ionic'
        
        # Check for Xamarin
        if any((self.extract_dir / 'assemblies').glob('*.dll')):
            return 'Xamarin'
        
        # Native Android
        return 'Native Android'
    
    def generate_report(self, output_format: str = 'text') -> str:
        """Generate analysis report."""
        
        if output_format == 'json':
            return json.dumps(self.analysis_results, indent=2)
        
        # Text report
        report = []
        report.append("=" * 70)
        report.append("APK ANALYSIS REPORT")
        report.append("=" * 70)
        report.append(f"\nAPK File: {self.apk_path.name}")
        report.append(f"App Type: {self.detect_app_type()}")
        
        # Structure
        if 'structure' in self.analysis_results:
            s = self.analysis_results['structure']
            report.append(f"\n📁 STRUCTURE")
            report.append(f"   Total Size: {s['total_size_mb']} MB")
            report.append(f"   Total Files: {s['total_files']}")
            report.append(f"   Top Directories: {', '.join(s['directories'][:5])}")
            report.append(f"\n   File Types:")
            for ext, count in list(s['file_types'].items())[:10]:
                report.append(f"      {ext}: {count}")
        
        # Native Libraries
        if 'native_libraries' in self.analysis_results:
            libs = self.analysis_results['native_libraries']
            if libs.get('found'):
                report.append(f"\n🔧 NATIVE LIBRARIES")
                report.append(f"   Architectures: {', '.join(libs['architectures'])}")
                for arch in libs['architectures']:
                    top_libs = libs['libraries_by_arch'][arch][:5]
                    report.append(f"\n   {arch}:")
                    for lib in top_libs:
                        report.append(f"      {lib['name']} ({lib['size_mb']} MB)")
        
        # Assets
        if 'assets' in self.analysis_results:
            assets = self.analysis_results['assets']
            if assets.get('found'):
                report.append(f"\n📦 NOTABLE ASSETS")
                for asset in assets['notable_files'][:10]:
                    report.append(f"   {asset['path']} ({asset['size_mb']} MB)")
        
        # React Native
        if 'react_native' in self.analysis_results:
            rn = self.analysis_results['react_native']
            if rn:
                report.append(f"\n⚛️  REACT NATIVE")
                report.append(f"   Bundle Size: {rn['size_mb']} MB")
                if rn.get('detected_libraries'):
                    report.append(f"   Libraries: {', '.join(rn['detected_libraries'][:10])}")
                if rn.get('detected_features'):
                    report.append(f"   Features: {', '.join(rn['detected_features'])}")
        
        # Metadata
        if 'metadata' in self.analysis_results:
            meta = self.analysis_results['metadata']
            if meta.get('kotlin_tooling'):
                kt = meta['kotlin_tooling']
                report.append(f"\n🏗️  BUILD INFO")
                report.append(f"   Build System: {kt.get('buildSystem')} {kt.get('buildSystemVersion')}")
                report.append(f"   Kotlin Version: {kt.get('buildPluginVersion')}")
        
        report.append("\n" + "=" * 70)
        report.append("\nWhat you can do with this APK:")
        report.append("1. Extract and analyze the React Native JavaScript bundle")
        report.append("2. Examine native libraries for ML/AI capabilities (GGML detected)")
        report.append("3. Extract and study app resources (fonts, images, etc.)")
        report.append("4. Reverse engineer the app structure and features")
        report.append("5. Test on Android emulator or device")
        report.append("6. Create documentation or integration guides")
        report.append("=" * 70)
        
        return "\n".join(report)
    
    def run_full_analysis(self):
        """Run complete analysis pipeline."""
        self.extract_apk()
        self.analyze_structure()
        self.analyze_native_libraries()
        self.analyze_assets()
        self.analyze_metadata()
        self.analyze_react_native_bundle()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Analyze Android APK files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s app-release.apk
  %(prog)s app-release.apk --format json
  %(prog)s app-release.apk --output report.txt
        """
    )
    
    parser.add_argument('apk_file', help='Path to APK file')
    parser.add_argument('--format', choices=['text', 'json'], default='text',
                       help='Output format (default: text)')
    parser.add_argument('--output', '-o', help='Output file (default: stdout)')
    
    args = parser.parse_args()
    
    try:
        analyzer = APKAnalyzer(args.apk_file)
        analyzer.run_full_analysis()
        report = analyzer.generate_report(args.format)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(report)
            print(f"\n✓ Report saved to {args.output}")
        else:
            print(report)
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
