#!/usr/bin/env node

/**
 * Security audit script for the AI Chatbot application
 * Checks for common security vulnerabilities and misconfigurations
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const SECURITY_CHECKS = {
  // Critical security issues
  CRITICAL: [
    'hardcoded secrets',
    'SQL injection vulnerabilities',
    'XSS vulnerabilities',
    'authentication bypasses',
    'authorization flaws',
  ],
  // High priority security issues
  HIGH: [
    'missing input validation',
    'insecure dependencies',
    'missing security headers',
    'weak password policies',
    'insecure file uploads',
  ],
  // Medium priority security issues
  MEDIUM: [
    'information disclosure',
    'missing rate limiting',
    'insecure cookies',
    'CSRF vulnerabilities',
    'directory traversal',
  ],
  // Low priority security issues
  LOW: [
    'verbose error messages',
    'missing security configurations',
    'outdated dependencies',
    'weak encryption',
  ],
};

class SecurityAuditor {
  constructor() {
    this.findings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    this.scannedFiles = 0;
    this.totalFiles = 0;
  }

  async runAudit() {
    console.log('🔒 Starting Security Audit...\n');

    try {
      // Check dependencies for vulnerabilities
      await this.checkDependencies();

      // Scan source code for security issues
      await this.scanSourceCode();

      // Check configuration files
      await this.checkConfigurations();

      // Check environment variables
      await this.checkEnvironmentVariables();

      // Generate report
      this.generateReport();
    } catch (error) {
      console.error('❌ Error during security audit:', error.message);
      process.exit(1);
    }
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies for vulnerabilities...');

    try {
      // Check for npm audit
      const auditResult = execSync('pnpm audit --json', {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          const severity = vuln.severity.toLowerCase();
          const finding = {
            type: 'dependency_vulnerability',
            package: pkg,
            severity: vuln.severity,
            title: vuln.title,
            description: `Vulnerable dependency: ${pkg} (${vuln.severity})`,
            recommendation: `Update ${pkg} to version ${vuln.patched || 'latest'}`,
          };

          if (severity === 'critical') {
            this.findings.critical.push(finding);
          } else if (severity === 'high') {
            this.findings.high.push(finding);
          } else if (severity === 'moderate') {
            this.findings.medium.push(finding);
          } else {
            this.findings.low.push(finding);
          }
        });
      }

      console.log(`✅ Dependency audit completed`);
    } catch (error) {
      console.log('⚠️  Could not run dependency audit:', error.message);
    }
  }

  async scanSourceCode() {
    console.log('🔍 Scanning source code for security issues...');

    const sourceFiles = this.getSourceFiles();
    this.totalFiles = sourceFiles.length;

    for (const file of sourceFiles) {
      await this.scanFile(file);
      this.scannedFiles++;
    }

    console.log(`✅ Scanned ${this.scannedFiles} source files`);
  }

  getSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const excludeDirs = ['node_modules', '.next', 'dist', 'build', '__tests__'];

    function walkDir(dir) {
      const files = [];

      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !excludeDirs.includes(item)) {
            files.push(...walkDir(fullPath));
          } else if (
            stat.isFile() &&
            extensions.some((ext) => item.endsWith(ext))
          ) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }

      return files;
    }

    return walkDir(process.cwd());
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      // Check for hardcoded secrets
      this.checkHardcodedSecrets(content, relativePath);

      // Check for SQL injection vulnerabilities
      this.checkSqlInjection(content, relativePath);

      // Check for XSS vulnerabilities
      this.checkXssVulnerabilities(content, relativePath);

      // Check for insecure patterns
      this.checkInsecurePatterns(content, relativePath);

      // Check for missing input validation
      this.checkInputValidation(content, relativePath);
    } catch (error) {
      // Skip files we can't read
    }
  }

  checkHardcodedSecrets(content, filePath) {
    const secretPatterns = [
      {
        pattern: /(?:password|pwd|pass)\s*[:=]\s*['"][^'"]{8,}['"]/,
        name: 'Hardcoded password',
      },
      {
        pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{16,}['"]/,
        name: 'Hardcoded API key',
      },
      {
        pattern: /(?:secret|token)\s*[:=]\s*['"][^'"]{16,}['"]/,
        name: 'Hardcoded secret/token',
      },
      {
        pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*['"][^'"]{32,}['"]/,
        name: 'Hardcoded private key',
      },
      {
        pattern: /(?:auth[_-]?secret|authsecret)\s*[:=]\s*['"][^'"]{16,}['"]/,
        name: 'Hardcoded auth secret',
      },
    ];

    secretPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.findings.critical.push({
          type: 'hardcoded_secret',
          file: filePath,
          description: `${name} found in source code`,
          recommendation: 'Move secrets to environment variables',
          line: this.getLineNumber(content, matches[0]),
        });
      }
    });
  }

  checkSqlInjection(content, filePath) {
    const sqlPatterns = [
      /\$\{[^}]*\}.*(?:SELECT|INSERT|UPDATE|DELETE)/i,
      /['"][^'"]*\+[^'"]*['"].*(?:SELECT|INSERT|UPDATE|DELETE)/i,
      /(?:SELECT|INSERT|UPDATE|DELETE).*\$\{[^}]*\}/i,
    ];

    sqlPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        this.findings.high.push({
          type: 'sql_injection',
          file: filePath,
          description: 'Potential SQL injection vulnerability detected',
          recommendation: 'Use parameterized queries or ORM methods',
        });
      }
    });
  }

  checkXssVulnerabilities(content, filePath) {
    const xssPatterns = [
      /dangerouslySetInnerHTML/,
      /innerHTML\s*=\s*[^;]*\+/,
      /document\.write\s*\(/,
      /eval\s*\(/,
      /new\s+Function\s*\(/,
    ];

    xssPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        this.findings.high.push({
          type: 'xss_vulnerability',
          file: filePath,
          description: 'Potential XSS vulnerability detected',
          recommendation:
            'Sanitize user input and use safe DOM manipulation methods',
        });
      }
    });
  }

  checkInsecurePatterns(content, filePath) {
    const insecurePatterns = [
      {
        pattern: /Math\.random\(\)/,
        severity: 'medium',
        description: 'Weak random number generation',
      },
      {
        pattern: /console\.log\(.*(?:password|secret|token|key).*\)/i,
        severity: 'medium',
        description: 'Sensitive data in console logs',
      },
      {
        pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/,
        severity: 'low',
        description: 'Insecure HTTP connection',
      },
      {
        pattern: /setTimeout\s*\(\s*['"][^'"]*['"]/,
        severity: 'medium',
        description: 'Code execution via setTimeout string',
      },
      {
        pattern: /setInterval\s*\(\s*['"][^'"]*['"]/,
        severity: 'medium',
        description: 'Code execution via setInterval string',
      },
    ];

    insecurePatterns.forEach(({ pattern, severity, description }) => {
      if (pattern.test(content)) {
        this.findings[severity].push({
          type: 'insecure_pattern',
          file: filePath,
          description,
          recommendation: 'Review and replace with secure alternatives',
        });
      }
    });
  }

  checkInputValidation(content, filePath) {
    // Check for API routes without validation
    if (filePath.includes('/api/') && filePath.endsWith('.ts')) {
      const hasValidation =
        /z\./.test(content) ||
        /validate/.test(content) ||
        /schema/.test(content);
      const hasUserInput =
        /request\.json\(\)/.test(content) || /formData\.get/.test(content);

      if (hasUserInput && !hasValidation) {
        this.findings.high.push({
          type: 'missing_validation',
          file: filePath,
          description: 'API endpoint processes user input without validation',
          recommendation: 'Add input validation using Zod or similar library',
        });
      }
    }
  }

  checkConfigurations() {
    console.log('⚙️  Checking configuration files...');

    // Check Next.js configuration
    this.checkNextConfig();

    // Check middleware configuration
    this.checkMiddleware();

    // Check package.json for security issues
    this.checkPackageJson();

    console.log('✅ Configuration check completed');
  }

  checkNextConfig() {
    const configPath = path.join(process.cwd(), 'next.config.ts');

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');

      // Check for security headers
      if (!content.includes('headers')) {
        this.findings.medium.push({
          type: 'missing_security_headers',
          file: 'next.config.ts',
          description: 'Missing security headers configuration',
          recommendation: 'Add security headers to Next.js configuration',
        });
      }

      // Check for CSP
      if (!content.includes('Content-Security-Policy')) {
        this.findings.medium.push({
          type: 'missing_csp',
          file: 'next.config.ts',
          description: 'Missing Content Security Policy',
          recommendation: 'Add CSP headers for XSS protection',
        });
      }
    }
  }

  checkMiddleware() {
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');

    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');

      // Check for rate limiting
      if (!content.includes('rate') && !content.includes('limit')) {
        this.findings.medium.push({
          type: 'missing_rate_limiting',
          file: 'middleware.ts',
          description: 'Missing rate limiting in middleware',
          recommendation: 'Add rate limiting to prevent abuse',
        });
      }

      // Check for CSRF protection
      if (!content.includes('csrf') && !content.includes('origin')) {
        this.findings.medium.push({
          type: 'missing_csrf_protection',
          file: 'middleware.ts',
          description: 'Missing CSRF protection',
          recommendation: 'Add CSRF protection for state-changing operations',
        });
      }
    }
  }

  checkPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');

    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check for security-related scripts
      const scripts = packageJson.scripts || {};

      if (!scripts.audit && !scripts['security:audit']) {
        this.findings.low.push({
          type: 'missing_security_script',
          file: 'package.json',
          description: 'Missing security audit script',
          recommendation: 'Add npm audit script to package.json',
        });
      }
    }
  }

  checkEnvironmentVariables() {
    console.log('🌍 Checking environment variables...');

    const envFiles = ['.env', '.env.local', '.env.example'];

    envFiles.forEach((envFile) => {
      const envPath = path.join(process.cwd(), envFile);

      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');

        // Check for weak secrets
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('=') && !line.startsWith('#')) {
            const [key, value] = line.split('=');

            if (
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('key')
            ) {
              if (value && value.length < 32) {
                this.findings.medium.push({
                  type: 'weak_secret',
                  file: envFile,
                  description: `Weak secret detected: ${key}`,
                  recommendation: 'Use stronger secrets (32+ characters)',
                  line: index + 1,
                });
              }
            }
          }
        });
      }
    });

    console.log('✅ Environment variables check completed');
  }

  getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return null;
  }

  generateReport() {
    console.log('\n📊 Security Audit Report');
    console.log('========================\n');

    const totalFindings = Object.values(this.findings).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    if (totalFindings === 0) {
      console.log('🎉 No security issues found!');
      return;
    }

    console.log(`Total findings: ${totalFindings}\n`);

    // Critical findings
    if (this.findings.critical.length > 0) {
      console.log(`🚨 CRITICAL (${this.findings.critical.length}):`);
      this.findings.critical.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.description}`);
        console.log(`   File: ${finding.file}`);
        if (finding.line) console.log(`   Line: ${finding.line}`);
        console.log(`   Fix: ${finding.recommendation}\n`);
      });
    }

    // High findings
    if (this.findings.high.length > 0) {
      console.log(`⚠️  HIGH (${this.findings.high.length}):`);
      this.findings.high.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.description}`);
        console.log(`   File: ${finding.file}`);
        if (finding.line) console.log(`   Line: ${finding.line}`);
        console.log(`   Fix: ${finding.recommendation}\n`);
      });
    }

    // Medium findings
    if (this.findings.medium.length > 0) {
      console.log(`⚡ MEDIUM (${this.findings.medium.length}):`);
      this.findings.medium.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.description}`);
        console.log(`   File: ${finding.file}`);
        if (finding.line) console.log(`   Line: ${finding.line}`);
        console.log(`   Fix: ${finding.recommendation}\n`);
      });
    }

    // Low findings
    if (this.findings.low.length > 0) {
      console.log(`ℹ️  LOW (${this.findings.low.length}):`);
      this.findings.low.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.description}`);
        console.log(`   File: ${finding.file}`);
        if (finding.line) console.log(`   Line: ${finding.line}`);
        console.log(`   Fix: ${finding.recommendation}\n`);
      });
    }

    // Summary and recommendations
    console.log('🔧 Recommendations:');
    console.log('==================\n');

    const recommendations = [
      '1. 🔐 Security Headers:',
      '   - Implement comprehensive security headers',
      '   - Add Content Security Policy (CSP)',
      '   - Enable HSTS for HTTPS enforcement',
      '',
      '2. 🛡️  Input Validation:',
      '   - Validate all user inputs using Zod schemas',
      '   - Sanitize HTML content to prevent XSS',
      '   - Implement proper file upload validation',
      '',
      '3. 🚦 Rate Limiting:',
      '   - Add rate limiting to all API endpoints',
      '   - Implement progressive delays for repeated failures',
      '   - Monitor and log suspicious activity',
      '',
      '4. 🔑 Authentication & Authorization:',
      '   - Use strong password policies',
      '   - Implement proper session management',
      '   - Add multi-factor authentication where appropriate',
      '',
      '5. 📦 Dependencies:',
      '   - Regularly audit dependencies for vulnerabilities',
      '   - Keep all packages up to date',
      '   - Use tools like Snyk or npm audit',
      '',
      '6. 🔍 Monitoring:',
      '   - Implement security logging',
      '   - Set up intrusion detection',
      '   - Monitor for unusual patterns',
    ];

    recommendations.forEach((rec) => console.log(rec));

    // Exit with error code if critical or high severity issues found
    if (this.findings.critical.length > 0 || this.findings.high.length > 0) {
      console.log(
        '\n❌ Security audit failed due to critical or high severity issues.',
      );
      process.exit(1);
    } else {
      console.log('\n✅ Security audit completed successfully.');
    }
  }
}

// Run the security audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit();
}

module.exports = { SecurityAuditor };
