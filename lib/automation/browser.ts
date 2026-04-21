/**
 * Browser Automation Engine
 * Playwright-based autonomous browser control
 */

import type { Browser, Page, BrowserContext } from 'playwright';

export interface BrowserAutomationConfig {
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
  locale?: string;
}

export interface NavigationOptions {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}

export interface ClickOptions {
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
}

export interface TypeOptions {
  selector: string;
  text: string;
  delay?: number;
  clear?: boolean;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  path?: string;
  type?: 'png' | 'jpeg';
  quality?: number;
}

class BrowserAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private playwright: any = null;

  /**
   * Initialize browser
   */
  async initialize(config: BrowserAutomationConfig = {}) {
    try {
      // Dynamic import to avoid bundling issues
      this.playwright = await import('playwright');
      
      this.browser = await this.playwright.chromium.launch({
        headless: config.headless ?? true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.context = await this.browser.newContext({
        viewport: config.viewport || { width: 1920, height: 1080 },
        userAgent: config.userAgent,
        locale: config.locale || 'en-US',
      });

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(config.timeout || 30000);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize browser',
      };
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(options: NavigationOptions) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.goto(options.url, {
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || 30000,
    });

    return {
      url: this.page.url(),
      title: await this.page.title(),
    };
  }

  /**
   * Click element
   */
  async click(options: ClickOptions) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.click(options.selector, {
      button: options.button || 'left',
      clickCount: options.clickCount || 1,
      delay: options.delay,
    });

    return { success: true, selector: options.selector };
  }

  /**
   * Type text
   */
  async type(options: TypeOptions) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    if (options.clear) {
      await this.page.fill(options.selector, '');
    }

    await this.page.type(options.selector, options.text, {
      delay: options.delay || 50,
    });

    return { success: true, selector: options.selector, text: options.text };
  }

  /**
   * Fill form
   */
  async fill(selector: string, value: string) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.fill(selector, value);
    return { success: true, selector, value };
  }

  /**
   * Select option
   */
  async select(selector: string, value: string | string[]) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.selectOption(selector, value);
    return { success: true, selector, value };
  }

  /**
   * Check checkbox
   */
  async check(selector: string) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.check(selector);
    return { success: true, selector };
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector: string) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.uncheck(selector);
    return { success: true, selector };
  }

  /**
   * Wait for selector
   */
  async waitFor(selector: string, timeout?: number) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.waitForSelector(selector, { timeout });
    return { success: true, selector };
  }

  /**
   * Take screenshot
   */
  async screenshot(options: ScreenshotOptions = {}) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const screenshot = await this.page.screenshot({
      fullPage: options.fullPage ?? false,
      path: options.path,
      type: options.type || 'png',
      quality: options.quality,
    });

    return {
      success: true,
      data: screenshot,
      path: options.path,
    };
  }

  /**
   * Get page content
   */
  async getContent() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    return {
      html: await this.page.content(),
      text: await this.page.textContent('body'),
      title: await this.page.title(),
      url: this.page.url(),
    };
  }

  /**
   * Execute JavaScript
   */
  async evaluate<T>(script: string | Function, ...args: any[]): Promise<T> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    return await this.page.evaluate(script, ...args);
  }

  /**
   * Get element text
   */
  async getText(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    return await this.page.textContent(selector);
  }

  /**
   * Get element attribute
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    return await this.page.getAttribute(selector, attribute);
  }

  /**
   * Get all elements
   */
  async getAllElements(selector: string) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    return await this.page.$$eval(selector, elements =>
      elements.map(el => ({
        tag: el.tagName,
        text: el.textContent,
        html: el.innerHTML,
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as Record<string, string>),
      }))
    );
  }

  /**
   * Extract data from page
   */
  async extractData(selectors: Record<string, string>) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const data: Record<string, any> = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        data[key] = await this.page.textContent(selector);
      } catch {
        data[key] = null;
      }
    }

    return data;
  }

  /**
   * Fill form intelligently
   */
  async fillForm(data: Record<string, string>) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    // Detect all form fields
    const fields = await this.page.$$eval('input, select, textarea', elements =>
      elements.map(el => ({
        name: (el as HTMLInputElement).name,
        id: el.id,
        type: (el as HTMLInputElement).type,
        tag: el.tagName,
        placeholder: (el as HTMLInputElement).placeholder,
        label: (document.querySelector(`label[for="${el.id}"]`) as HTMLElement)?.textContent || '',
      }))
    );

    const filled: string[] = [];

    for (const field of fields) {
      // Try to match field with data
      const fieldKey = field.name || field.id || field.placeholder.toLowerCase();
      
      for (const [key, value] of Object.entries(data)) {
        if (fieldKey.toLowerCase().includes(key.toLowerCase())) {
          const selector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
          
          try {
            if (field.tag === 'SELECT') {
              await this.select(selector, value);
            } else if (field.type === 'checkbox' || field.type === 'radio') {
              if (value === 'true' || value === '1') {
                await this.check(selector);
              }
            } else {
              await this.fill(selector, value);
            }
            
            filled.push(fieldKey);
          } catch (error) {
            console.error(`Failed to fill ${fieldKey}:`, error);
          }
        }
      }
    }

    return { success: true, filled };
  }

  /**
   * Scroll page
   */
  async scroll(x: number, y: number) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.evaluate(({ x, y }) => {
      window.scrollTo(x, y);
    }, { x, y });

    return { success: true, x, y };
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }

    return { success: true };
  }

  /**
   * Get current page
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }
}

export const browserAutomation = new BrowserAutomation();
export default browserAutomation;
