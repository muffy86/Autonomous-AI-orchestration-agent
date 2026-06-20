/**
 * Browser Automation Engine
 * Complete Puppeteer/Playwright integration for browser agent
 */

export class BrowserAutomation {
  private browser: any = null;
  private page: any = null;
  private puppeteer: any = null;

  constructor() {}

  async init() {
    // Dynamic import of Puppeteer
    try {
      this.puppeteer = await import('npm:puppeteer@21.6.0');
      console.log('✅ Browser automation ready');
      return true;
    } catch (error: any) {
      console.error('Failed to load Puppeteer:', error.message);
      return false;
    }
  }

  async launch(options: any = {}) {
    if (!this.puppeteer) {
      await this.init();
    }

    this.browser = await this.puppeteer.launch({
      headless: options.headless ?? false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
      ...options
    });

    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewport({
      width: 1920,
      height: 1080
    });

    // Set user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    return this.page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  // ===== Navigation =====

  async goto(url: string, options: any = {}) {
    if (!this.page) await this.launch();

    return await this.page.goto(url, {
      waitUntil: options.waitUntil || 'networkidle2',
      timeout: options.timeout || 30000
    });
  }

  async back() {
    return await this.page.goBack();
  }

  async forward() {
    return await this.page.goForward();
  }

  async reload() {
    return await this.page.reload();
  }

  // ===== Interaction =====

  async click(selector: string, options: any = {}) {
    await this.page.waitForSelector(selector, { timeout: options.timeout || 5000 });
    return await this.page.click(selector);
  }

  async type(selector: string, text: string, options: any = {}) {
    await this.page.waitForSelector(selector);
    return await this.page.type(selector, text, {
      delay: options.delay || 50
    });
  }

  async select(selector: string, value: string) {
    return await this.page.select(selector, value);
  }

  async hover(selector: string) {
    return await this.page.hover(selector);
  }

  async focus(selector: string) {
    return await this.page.focus(selector);
  }

  // ===== Data Extraction =====

  async extract(selector: string, attribute?: string) {
    if (attribute) {
      return await this.page.$eval(selector, (el: any, attr: string) => el.getAttribute(attr), attribute);
    }
    return await this.page.$eval(selector, (el: any) => el.textContent);
  }

  async extractAll(selector: string, attribute?: string) {
    if (attribute) {
      return await this.page.$$eval(
        selector,
        (els: any[], attr: string) => els.map(el => el.getAttribute(attr)),
        attribute
      );
    }
    return await this.page.$$eval(selector, (els: any[]) => els.map(el => el.textContent));
  }

  async extractStructured(config: any) {
    return await this.page.evaluate((conf: any) => {
      const result: any = {};

      for (const [key, selector] of Object.entries(conf)) {
        const elements = document.querySelectorAll(selector as string);
        if (elements.length === 1) {
          result[key] = elements[0].textContent?.trim();
        } else {
          result[key] = Array.from(elements).map(el => el.textContent?.trim());
        }
      }

      return result;
    }, config);
  }

  async scrapeTable(selector: string) {
    return await this.page.$$eval(selector, (tables: any[]) => {
      return tables.map(table => {
        const headers: string[] = [];
        const rows: any[] = [];

        // Extract headers
        const headerCells = table.querySelectorAll('thead th, thead td');
        headerCells.forEach((cell: any) => {
          headers.push(cell.textContent?.trim() || '');
        });

        // Extract rows
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach((row: any) => {
          const rowData: any = {};
          const cells = row.querySelectorAll('td');
          
          cells.forEach((cell: any, i: number) => {
            const key = headers[i] || `column_${i}`;
            rowData[key] = cell.textContent?.trim() || '';
          });

          rows.push(rowData);
        });

        return { headers, rows };
      });
    });
  }

  async scrapeLinks(selector = 'a') {
    return await this.page.$$eval(selector, (links: any[]) => {
      return links.map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        title: link.title
      }));
    });
  }

  async scrapeImages(selector = 'img') {
    return await this.page.$$eval(selector, (images: any[]) => {
      return images.map(img => ({
        src: img.src,
        alt: img.alt,
        title: img.title,
        width: img.width,
        height: img.height
      }));
    });
  }

  // ===== Smart Extraction (AI-powered) =====

  async extractWithAI(prompt: string, llm: any) {
    // Get page content
    const content = await this.page.content();
    const text = await this.page.evaluate(() => document.body.innerText);

    // Use AI to extract specific information
    const aiPrompt = `Extract the following information from this webpage:

${prompt}

Page content (first 5000 chars):
${text.slice(0, 5000)}

Return as JSON.`;

    const response = await llm.generate({
      model: 'llama3.1:8b',
      prompt: aiPrompt,
      format: 'json'
    });

    return JSON.parse(response.response);
  }

  // ===== Forms =====

  async fillForm(formData: any) {
    for (const [selector, value] of Object.entries(formData)) {
      const element = await this.page.$(selector);
      if (!element) continue;

      const tagName = await element.evaluate((el: any) => el.tagName.toLowerCase());

      if (tagName === 'input' || tagName === 'textarea') {
        await this.page.type(selector, String(value));
      } else if (tagName === 'select') {
        await this.page.select(selector, String(value));
      }
    }
  }

  async submitForm(formSelector: string) {
    await this.page.click(`${formSelector} [type="submit"]`);
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  // ===== Screenshots & PDFs =====

  async screenshot(options: any = {}) {
    return await this.page.screenshot({
      path: options.path,
      fullPage: options.fullPage ?? true,
      type: options.type || 'png'
    });
  }

  async pdf(options: any = {}) {
    return await this.page.pdf({
      path: options.path,
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
  }

  // ===== Waiting =====

  async waitForSelector(selector: string, options: any = {}) {
    return await this.page.waitForSelector(selector, {
      timeout: options.timeout || 10000
    });
  }

  async waitForNavigation(options: any = {}) {
    return await this.page.waitForNavigation({
      waitUntil: options.waitUntil || 'networkidle2',
      timeout: options.timeout || 30000
    });
  }

  async waitForText(text: string, options: any = {}) {
    return await this.page.waitForFunction(
      (searchText: string) => document.body.innerText.includes(searchText),
      { timeout: options.timeout || 10000 },
      text
    );
  }

  async wait(ms: number) {
    return await this.page.waitForTimeout(ms);
  }

  // ===== Monitoring =====

  async monitorChanges(selector: string, callback: Function, interval = 5000) {
    let lastContent = await this.extract(selector);

    const monitor = setInterval(async () => {
      try {
        const currentContent = await this.extract(selector);
        if (currentContent !== lastContent) {
          callback({
            old: lastContent,
            new: currentContent,
            timestamp: Date.now()
          });
          lastContent = currentContent;
        }
      } catch (error) {
        console.error('Monitor error:', error);
      }
    }, interval);

    return () => clearInterval(monitor);
  }

  // ===== Advanced =====

  async evaluate(fn: Function, ...args: any[]) {
    return await this.page.evaluate(fn, ...args);
  }

  async injectScript(scriptContent: string) {
    return await this.page.evaluate(scriptContent);
  }

  async interceptRequests(handler: Function) {
    await this.page.setRequestInterception(true);
    this.page.on('request', (request: any) => {
      handler(request);
    });
  }

  async blockResources(types: string[] = ['image', 'stylesheet', 'font']) {
    await this.page.setRequestInterception(true);
    this.page.on('request', (request: any) => {
      if (types.includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  async getCookies() {
    return await this.page.cookies();
  }

  async setCookies(cookies: any[]) {
    return await this.page.setCookie(...cookies);
  }

  async clearCookies() {
    const cookies = await this.page.cookies();
    for (const cookie of cookies) {
      await this.page.deleteCookie(cookie);
    }
  }

  // ===== Performance =====

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find((p: any) => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find((p: any) => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
  }

  // ===== Utilities =====

  async getPageInfo() {
    return await this.page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      meta: {
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content'),
        author: document.querySelector('meta[name="author"]')?.getAttribute('content')
      }
    }));
  }

  async getPageStructure() {
    return await this.page.evaluate(() => {
      const structure: any = {
        headings: {},
        links: 0,
        images: 0,
        forms: 0,
        tables: 0
      };

      // Count headings
      for (let i = 1; i <= 6; i++) {
        structure.headings[`h${i}`] = document.querySelectorAll(`h${i}`).length;
      }

      structure.links = document.querySelectorAll('a').length;
      structure.images = document.querySelectorAll('img').length;
      structure.forms = document.querySelectorAll('form').length;
      structure.tables = document.querySelectorAll('table').length;

      return structure;
    });
  }
}

export default BrowserAutomation;
