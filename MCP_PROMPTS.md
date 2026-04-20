# MCP Example Prompts & Use Cases

This document provides ready-to-use prompts for testing the MCP autonomous AI capabilities.

## 🚀 Quick Test Prompts

### Test 1: System Check
```
List all available AI models and tools in this MCP server.
Show me which providers are configured and which are free.
```

### Test 2: Simple Web Search
```
Search the web for the latest news about AI advancements 
and summarize the top 3 findings.
```

### Test 3: Code Analysis
```
Analyze this code and suggest improvements:

function getUserData(id) {
  var data = db.query("SELECT * FROM users WHERE id = " + id);
  return data;
}
```

## 💻 Development Use Cases

### Code Review
```
Review this pull request and provide detailed feedback:

[Paste code diff here]

Check for:
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Test coverage
- Documentation
```

### Test Generation
```
Generate comprehensive unit tests for this function:

export async function processPayment(
  userId: string,
  amount: number,
  currency: string
): Promise<PaymentResult> {
  // Implementation here
}

Use Jest and include edge cases.
```

### Documentation
```
Generate complete API documentation for this REST endpoint:

POST /api/users
Creates a new user account

Request body:
- email (required)
- name (required)
- role (optional)

Include: description, parameters, responses, examples
```

### Refactoring
```
Refactor this code to use modern JavaScript best practices:

var app = {
  init: function() {
    var self = this;
    $('#button').click(function() {
      self.handleClick();
    });
  },
  handleClick: function() {
    // Handle click
  }
};
```

## 🔍 Research Use Cases

### Technology Research
```
Research the Model Context Protocol (MCP) and create a 
comprehensive report covering:
1. What it is and why it matters
2. Key features and capabilities
3. Current implementations
4. Future potential
5. Comparison with other protocols

Include sources and citations.
```

### Competitive Analysis
```
Compare and analyze the following AI models:
- GPT-4o
- Claude 3.5 Sonnet
- Gemini 2.0 Flash
- Llama 3.3 70B

Create a comparison table with:
- Capabilities
- Context window
- Speed
- Cost
- Best use cases
```

### Market Research
```
Research the current state of autonomous AI agents in 2026.
Include:
- Major players and platforms
- Key capabilities
- Pricing models
- Adoption trends
- Future predictions
```

## 📊 Data Analysis Use Cases

### Data Processing
```
Process this sales data and provide insights:

[CSV data]
month,revenue,customers,churn_rate
Jan,50000,120,5
Feb,55000,135,4
Mar,48000,140,8

Calculate:
- Month-over-month growth
- Average revenue per customer
- Identify trends
- Predict next month
```

### Anomaly Detection
```
Analyze this server log data and identify anomalies:

[Log data with timestamps, response times, error codes]

Detect:
- Unusual spike patterns
- Error rate changes
- Performance degradation
- Potential security issues
```

### Visualization
```
Create a data visualization plan for this dataset:

[Dataset description]

Suggest:
- Best chart types
- Key metrics to highlight
- Interactive features
- Color scheme
- Layout
```

## 🤖 Automation Use Cases

### Workflow Automation
```
Create an automation workflow that:

1. Monitors GitHub repository for new issues
2. Analyzes issue content and sentiment
3. Categorizes by type (bug/feature/question)
4. Suggests appropriate labels
5. Assigns to relevant team member
6. Posts summary to Slack channel

Provide the complete workflow configuration.
```

### Report Generation
```
Automate weekly report generation:

Data sources:
- Google Analytics
- GitHub commits
- JIRA tickets
- Customer support tickets

Generate PDF report with:
- Executive summary
- Key metrics
- Trend charts
- Action items
```

### Data Pipeline
```
Design a data pipeline that:

1. Fetches data from multiple APIs (list sources)
2. Cleans and validates data
3. Transforms to common schema
4. Loads into database
5. Sends completion notification

Include error handling and retry logic.
```

## 🎨 Content Generation Use Cases

### Blog Post
```
Write a professional blog post about autonomous AI agents.

Requirements:
- 1000 words
- Technical but accessible tone
- Include real-world examples
- SEO-optimized
- Add relevant statistics
- Conclude with future outlook
```

### Social Media Campaign
```
Create a 7-day social media campaign for an AI chatbot product.

For each day provide:
- Platform-specific post (Twitter, LinkedIn, Instagram)
- Engaging headline
- Relevant hashtags
- Call to action
- Image description

Theme: AI-powered productivity
```

### Technical Documentation
```
Generate comprehensive technical documentation for a
REST API with these endpoints:

- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

Include: overview, authentication, rate limits, 
examples, error codes, best practices
```

## 🔐 Security Use Cases

### Security Audit
```
Perform a security audit of this codebase:

[Repository structure]

Check for:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication issues
- Authorization problems
- Dependency vulnerabilities
- Secrets in code
- Insecure configurations

Provide severity ratings and remediation steps.
```

### Penetration Testing Plan
```
Create a penetration testing plan for a web application:

Application: E-commerce site
Tech stack: React, Node.js, PostgreSQL

Include:
- Testing methodology
- Target areas
- Test scenarios
- Tools to use
- Success criteria
- Reporting format
```

## 📈 Business Use Cases

### Business Plan
```
Generate a business plan for an AI SaaS product:

Product: AI-powered code review tool
Market: Software development teams

Include:
- Executive summary
- Market analysis
- Product features
- Pricing strategy
- Go-to-market plan
- Financial projections
```

### Customer Support
```
Analyze customer support tickets and:

1. Categorize by issue type
2. Identify common problems
3. Measure sentiment trends
4. Suggest FAQ topics
5. Recommend product improvements
6. Draft response templates
```

## 🧪 Complex Multi-Step Prompts

### Full Stack Feature
```
Implement a complete user authentication feature:

1. Design database schema (users, sessions)
2. Create REST API endpoints
3. Implement JWT-based auth
4. Add rate limiting
5. Write unit tests
6. Generate API documentation
7. Add frontend login form
8. Implement session management

Provide all code, tests, and documentation.
```

### CI/CD Pipeline
```
Set up a complete CI/CD pipeline:

Requirements:
- GitHub Actions workflow
- Lint and format checks
- Unit and integration tests
- Security scanning
- Docker build and push
- Deploy to staging
- Smoke tests
- Deploy to production (manual)
- Notifications to Slack

Provide workflow YAML and documentation.
```

### Microservices Architecture
```
Design a microservices architecture for an e-commerce platform:

Services needed:
- User service
- Product catalog
- Shopping cart
- Order processing
- Payment
- Inventory
- Notifications

For each service provide:
- API design
- Database schema
- Inter-service communication
- Scaling strategy
- Monitoring approach
```

## 🎯 Model-Specific Prompts

### For Vision Models (GPT-4o, Grok Vision, Gemini)
```
[Attach image]

Analyze this UI mockup and:
1. Describe all components
2. Suggest improvements
3. Identify accessibility issues
4. Recommend color palette
5. Generate HTML/CSS code
```

### For Reasoning Models (Claude, Grok 3)
```
Solve this complex problem step by step:

[Complex algorithmic or logical problem]

Show your reasoning at each step and explain why
you chose each approach.
```

### For Fast Models (Gemini Flash, Groq)
```
Quick task: Generate 50 unit test cases for a
shopping cart function. Focus on edge cases.
```

## 🔄 Webhook Integration Prompts

### GitHub Integration
```
Set up GitHub webhook integration:

1. Configure webhook for push events
2. On push, analyze changed files
3. Run automated code review
4. Post comments on PR
5. Update status checks
6. Send summary to Slack
```

### Slack Bot
```
Create a Slack bot that responds to these commands:

/ai analyze [code] - Code analysis
/ai search [query] - Web search
/ai summarize [url] - Summarize article
/ai generate [type] [topic] - Generate content

Provide webhook handlers and response formatting.
```

## 💡 Tips for Best Results

1. **Be Specific**: Provide clear requirements and constraints
2. **Give Context**: Include relevant background information
3. **Set Format**: Specify desired output format
4. **Use Examples**: Show examples of what you want
5. **Iterate**: Refine prompts based on results
6. **Combine Tools**: Leverage multiple tools for complex tasks
7. **Check Models**: Use appropriate model for the task

## 📚 Additional Resources

- See `MCP_SETUP.md` for configuration and setup
- See `lib/mcp/tools/index.ts` for all available tools
- See `lib/mcp/skills/index.ts` for all available skills
- See `lib/mcp/providers/index.ts` for model capabilities
