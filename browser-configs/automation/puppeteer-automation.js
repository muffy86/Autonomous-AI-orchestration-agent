/**
 * Puppeteer Automation Suite
 * Automate browser tasks, scraping, testing, and AI workflows
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class BrowserAutomation {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      slowMo: options.slowMo || 0,
      devtools: options.devtools || false,
      userDataDir: options.userDataDir || null,
      executablePath: options.executablePath || null,
      args: options.args || [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    };
    
    this.browser = null;
    this.page = null;
    this.screenshots = [];
  }

  async launch() {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch(this.options);
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    
    // Set user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    
    console.log('✅ Browser launched');
    return this.page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 Browser closed');
    }
  }

  // ===== AI Chat Automation =====

  async chatWithChatGPT(prompt, options = {}) {
    console.log('💬 Chatting with ChatGPT...');
    
    await this.page.goto('https://chat.openai.com/', { waitUntil: 'networkidle2' });
    
    // Wait for login if needed
    if (await this.page.$('button:has-text("Log in")')) {
      console.log('⚠️  Not logged in. Please log in first.');
      await this.page.waitForNavigation({ timeout: 60000 });
    }
    
    // Type the prompt
    const inputSelector = 'textarea';
    await this.page.waitForSelector(inputSelector);
    await this.page.type(inputSelector, prompt);
    
    // Submit
    await this.page.keyboard.press('Enter');
    
    // Wait for response
    await this.page.waitForTimeout(options.waitTime || 5000);
    
    // Get the response
    const messages = await this.page.$$eval('[data-message-author-role="assistant"]', elements => {
      return elements.map(el => el.textContent);
    });
    
    const response = messages[messages.length - 1];
    console.log('✅ Response received');
    
    return response;
  }

  async chatWithClaude(prompt, options = {}) {
    console.log('💬 Chatting with Claude...');
    
    await this.page.goto('https://claude.ai/', { waitUntil: 'networkidle2' });
    
    const inputSelector = 'div[contenteditable="true"]';
    await this.page.waitForSelector(inputSelector);
    await this.page.type(inputSelector, prompt);
    
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(options.waitTime || 5000);
    
    // Extract response
    const response = await this.page.evaluate(() => {
      const messages = document.querySelectorAll('[data-role="assistant"]');
      return messages[messages.length - 1]?.textContent || '';
    });
    
    console.log('✅ Response received');
    return response;
  }

  async searchPerplexity(query) {
    console.log('🔍 Searching Perplexity...');
    
    await this.page.goto(`https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'networkidle2'
    });
    
    await this.page.waitForTimeout(3000);
    
    // Extract answer
    const answer = await this.page.evaluate(() => {
      const answerEl = document.querySelector('[class*="answer"]');
      return answerEl?.textContent || '';
    });
    
    console.log('✅ Search complete');
    return answer;
  }

  // ===== Web Scraping =====

  async scrapeLinks(url, selector = 'a') {
    console.log(`🔗 Scraping links from ${url}...`);
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    const links = await this.page.$$eval(selector, elements => {
      return elements.map(el => ({
        href: el.href,
        text: el.textContent.trim(),
        title: el.title
      })).filter(link => link.href);
    });
    
    console.log(`✅ Found ${links.length} links`);
    return links;
  }

  async scrapeTable(url, selector = 'table') {
    console.log(`📊 Scraping table from ${url}...`);
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    const data = await this.page.$$eval(selector, tables => {
      return tables.map(table => {
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          return cells.map(cell => cell.textContent.trim());
        });
      });
    });
    
    console.log('✅ Table scraped');
    return data;
  }

  async scrapeArticle(url) {
    console.log(`📰 Scraping article from ${url}...`);
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    const article = await this.page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent || '',
        author: document.querySelector('[rel="author"]')?.textContent || '',
        date: document.querySelector('time')?.getAttribute('datetime') || '',
        content: document.querySelector('article')?.textContent || document.body.textContent,
        images: Array.from(document.querySelectorAll('img')).map(img => img.src)
      };
    });
    
    console.log('✅ Article scraped');
    return article;
  }

  async scrapeCustom(url, extractors) {
    console.log(`🎯 Custom scraping from ${url}...`);
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    const data = {};
    
    for (const [key, selector] of Object.entries(extractors)) {
      if (selector.includes('$$')) {
        // Multiple elements
        const sel = selector.replace('$$', '').trim();
        data[key] = await this.page.$$eval(sel, els => els.map(el => el.textContent.trim()));
      } else if (selector.includes('@')) {
        // Attribute
        const [sel, attr] = selector.split('@');
        data[key] = await this.page.$eval(sel.trim(), (el, attr) => el.getAttribute(attr), attr.trim());
      } else {
        // Single element text
        data[key] = await this.page.$eval(selector, el => el.textContent.trim()).catch(() => null);
      }
    }
    
    console.log('✅ Custom scraping complete');
    return data;
  }

  // ===== Testing & Monitoring =====

  async performanceTest(url) {
    console.log(`⚡ Testing performance of ${url}...`);
    
    const metrics = await this.page.goto(url, { waitUntil: 'networkidle2' }).then(async () => {
      return await this.page.evaluate(() => {
        const timing = performance.timing;
        const paint = performance.getEntriesByType('paint');
        
        return {
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          resources: performance.getEntriesByType('resource').length
        };
      });
    });
    
    console.log('✅ Performance test complete:', metrics);
    return metrics;
  }

  async lighthouseAudit(url) {
    console.log(`💡 Running Lighthouse audit on ${url}...`);
    
    const lighthouse = require('lighthouse');
    const { lhr } = await lighthouse(url, {
      port: new URL(this.browser.wsEndpoint()).port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    
    const scores = {
      performance: lhr.categories.performance.score * 100,
      accessibility: lhr.categories.accessibility.score * 100,
      bestPractices: lhr.categories['best-practices'].score * 100,
      seo: lhr.categories.seo.score * 100
    };
    
    console.log('✅ Lighthouse audit complete:', scores);
    return { scores, fullReport: lhr };
  }

  async monitorChanges(url, selector, interval = 60000) {
    console.log(`👀 Monitoring ${url} for changes...`);
    
    let previousContent = null;
    
    const check = async () => {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      const content = await this.page.$eval(selector, el => el.textContent);
      
      if (previousContent !== null && content !== previousContent) {
        console.log('🔔 Change detected!');
        return { changed: true, previous: previousContent, current: content };
      }
      
      previousContent = content;
      return { changed: false, content };
    };
    
    return setInterval(check, interval);
  }

  // ===== Automation Workflows =====

  async autoScroll(maxScrolls = 10) {
    console.log('📜 Auto-scrolling page...');
    
    let previousHeight = 0;
    let scrollCount = 0;
    
    while (scrollCount < maxScrolls) {
      await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await this.page.waitForTimeout(1000);
      
      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      if (currentHeight === previousHeight) break;
      
      previousHeight = currentHeight;
      scrollCount++;
    }
    
    console.log(`✅ Scrolled ${scrollCount} times`);
  }

  async fillForm(formData) {
    console.log('📝 Filling form...');
    
    for (const [selector, value] of Object.entries(formData)) {
      const element = await this.page.$(selector);
      
      if (!element) {
        console.warn(`⚠️  Element not found: ${selector}`);
        continue;
      }
      
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await this.page.select(selector, value);
      } else if (tagName === 'input') {
        const type = await element.evaluate(el => el.type);
        if (type === 'checkbox' || type === 'radio') {
          if (value) await this.page.click(selector);
        } else {
          await this.page.type(selector, value);
        }
      } else if (tagName === 'textarea') {
        await this.page.type(selector, value);
      }
    }
    
    console.log('✅ Form filled');
  }

  async clickAndWaitForNav(selector, options = {}) {
    console.log(`🖱️  Clicking ${selector} and waiting for navigation...`);
    
    await Promise.all([
      this.page.waitForNavigation(options),
      this.page.click(selector)
    ]);
    
    console.log('✅ Navigation complete');
  }

  // ===== Screenshots & PDFs =====

  async screenshot(options = {}) {
    const filename = options.path || `screenshot-${Date.now()}.png`;
    
    await this.page.screenshot({
      path: filename,
      fullPage: options.fullPage !== false,
      type: options.type || 'png',
      ...options
    });
    
    this.screenshots.push(filename);
    console.log(`📸 Screenshot saved: ${filename}`);
    
    return filename;
  }

  async pdf(options = {}) {
    const filename = options.path || `page-${Date.now()}.pdf`;
    
    await this.page.pdf({
      path: filename,
      format: options.format || 'A4',
      printBackground: true,
      ...options
    });
    
    console.log(`📄 PDF saved: ${filename}`);
    return filename;
  }

  async screenshotElement(selector, options = {}) {
    const element = await this.page.$(selector);
    
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    
    const filename = options.path || `element-${Date.now()}.png`;
    
    await element.screenshot({
      path: filename,
      ...options
    });
    
    console.log(`📸 Element screenshot saved: ${filename}`);
    return filename;
  }

  // ===== Data Export =====

  async saveToJSON(data, filename) {
    await fs.writeFile(
      filename,
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    console.log(`💾 Data saved to ${filename}`);
  }

  async saveToCSV(data, filename) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    await fs.writeFile(filename, csv, 'utf8');
    console.log(`💾 Data saved to ${filename}`);
  }

  // ===== Utility Methods =====

  async waitForText(text, options = {}) {
    await this.page.waitForFunction(
      (text) => document.body.textContent.includes(text),
      options,
      text
    );
  }

  async getHTML() {
    return await this.page.content();
  }

  async getText(selector) {
    return await this.page.$eval(selector, el => el.textContent);
  }

  async getAttribute(selector, attribute) {
    return await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
  }

  async execute(fn, ...args) {
    return await this.page.evaluate(fn, ...args);
  }

  async injectScript(scriptPath) {
    await this.page.addScriptTag({ path: scriptPath });
    console.log(`✅ Script injected: ${scriptPath}`);
  }

  async injectCSS(cssPath) {
    await this.page.addStyleTag({ path: cssPath });
    console.log(`✅ CSS injected: ${cssPath}`);
  }

  async blockResources(types = ['image', 'font']) {
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      if (types.includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    console.log(`🚫 Blocking resources: ${types.join(', ')}`);
  }

  async setCookie(cookies) {
    await this.page.setCookie(...cookies);
    console.log('🍪 Cookies set');
  }

  async getCookies() {
    return await this.page.cookies();
  }
}

// ===== Usage Examples =====

async function examples() {
  const bot = new BrowserAutomation({ headless: false });
  
  try {
    await bot.launch();
    
    // Example 1: Chat with ChatGPT
    const response = await bot.chatWithChatGPT('Explain quantum computing in simple terms');
    console.log('ChatGPT:', response);
    
    // Example 2: Scrape links
    const links = await bot.scrapeLinks('https://news.ycombinator.com');
    await bot.saveToJSON(links, 'hn-links.json');
    
    // Example 3: Performance test
    const perf = await bot.performanceTest('https://example.com');
    console.log('Performance:', perf);
    
    // Example 4: Screenshot
    await bot.screenshot({ path: 'page.png', fullPage: true });
    
    // Example 5: Custom scraping
    const data = await bot.scrapeCustom('https://example.com', {
      title: 'h1',
      links: '$$ a',
      image: 'img@src'
    });
    
    console.log('Scraped data:', data);
    
  } finally {
    await bot.close();
  }
}

// Export
module.exports = BrowserAutomation;

// Run if called directly
if (require.main === module) {
  examples().catch(console.error);
}
