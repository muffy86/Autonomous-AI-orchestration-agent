# Integration Guide - Sovereign Browser OS

## Quick Integration Examples

### 1. Web Application Integration

#### React Application
```typescript
// hooks/useSovereignOS.ts
import { useState, useEffect } from 'react';
import { SovereignClient } from '@sovereign-os/client';

export function useSovereignOS() {
  const [client, setClient] = useState<SovereignClient | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sovereignClient = new SovereignClient({
      baseURL: 'http://localhost:8000',
      wsURL: 'ws://localhost:8000/ws'
    });

    sovereignClient.connect().then(() => {
      setClient(sovereignClient);
      setConnected(true);
    });

    return () => {
      sovereignClient.disconnect();
    };
  }, []);

  return { client, connected };
}

// Component usage
function ChatComponent() {
  const { client, connected } = useSovereignOS();
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text: string) => {
    if (!client) return;

    const response = await client.chat(text);
    setMessages([...messages, { role: 'user', content: text }, { role: 'assistant', content: response.response }]);
  };

  return (
    <div>
      {connected ? 'Connected ✓' : 'Connecting...'}
      {/* Your chat UI */}
    </div>
  );
}
```

#### Vue.js Application
```javascript
// composables/useSovereignOS.js
import { ref, onMounted, onUnmounted } from 'vue';
import { SovereignClient } from '@sovereign-os/client';

export function useSovereignOS() {
  const client = ref(null);
  const connected = ref(false);

  onMounted(async () => {
    client.value = new SovereignClient();
    await client.value.connect();
    connected.value = true;
  });

  onUnmounted(() => {
    if (client.value) {
      client.value.disconnect();
    }
  });

  return { client, connected };
}
```

---

### 2. Backend Integration (Node.js/Deno)

#### Express.js Middleware
```javascript
const { SovereignClient } = require('@sovereign-os/client');

const sovereignClient = new SovereignClient();
await sovereignClient.connect();

// Middleware to add Sovereign OS to req
app.use((req, res, next) => {
  req.sovereignOS = sovereignClient;
  next();
});

// Route using Sovereign OS
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  
  const analysis = await req.sovereignOS.chat(
    `Analyze this text: ${text}`,
    { model: 'llama3.1:8b' }
  );
  
  res.json({ analysis: analysis.response });
});
```

#### Deno/Oak Application
```typescript
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { SovereignClient } from "./sdk/client.ts";

const client = new SovereignClient();
await client.connect();

const router = new Router();

router.post("/api/search", async (ctx) => {
  const { query } = await ctx.request.body().value;
  const results = await client.smartSearch(query);
  ctx.response.body = results;
});

const app = new Application();
app.use(router.routes());
await app.listen({ port: 3000 });
```

---

### 3. Python Integration

```python
import requests
import json
import websocket

class SovereignClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.ws_url = "ws://localhost:8000/ws"
        self.ws = None
    
    def connect(self):
        self.ws = websocket.create_connection(self.ws_url)
        
    def chat(self, message, model="llama3.1:8b"):
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={"message": message, "model": model}
        )
        return response.json()
    
    def search(self, query):
        response = requests.post(
            f"{self.base_url}/api/search",
            json={"query": query}
        )
        return response.json()
    
    def execute_command(self, command):
        response = requests.post(
            f"{self.base_url}/api/command",
            json={"command": command}
        )
        return response.json()

# Usage
client = SovereignClient()
result = client.chat("Hello, how are you?")
print(result['response'])
```

---

### 4. Mobile Integration (React Native)

```typescript
import { SovereignClient } from '@sovereign-os/client';

class SovereignService {
  private client: SovereignClient;

  async initialize() {
    this.client = new SovereignClient({
      baseURL: 'https://your-server.com',
      wsURL: 'wss://your-server.com/ws'
    });
    
    await this.client.connect();
    
    // Listen to real-time updates
    this.client.on('agent:completed', (data) => {
      // Show notification
      console.log('Agent completed:', data);
    });
  }

  async chat(message: string) {
    return await this.client.chat(message);
  }

  async search(query: string) {
    return await this.client.smartSearch(query);
  }
}

export const sovereignService = new SovereignService();
```

---

### 5. WordPress Plugin

```php
<?php
/*
Plugin Name: Sovereign OS Integration
Description: Integrate Sovereign Browser OS with WordPress
Version: 1.0.0
*/

class SovereignOS {
    private $api_url = 'http://localhost:8000/api';
    
    public function chat($message) {
        $response = wp_remote_post($this->api_url . '/chat', array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'message' => $message,
                'model' => 'llama3.1:8b'
            ))
        ));
        
        return json_decode(wp_remote_retrieve_body($response), true);
    }
    
    public function search($query) {
        $response = wp_remote_post($this->api_url . '/search', array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array('query' => $query))
        ));
        
        return json_decode(wp_remote_retrieve_body($response), true);
    }
}

// Usage in templates
$sovereign = new SovereignOS();
$result = $sovereign->chat('Generate a blog post about AI');
echo $result['response'];
```

---

### 6. Chrome Extension Integration

```javascript
// background.js
import { SovereignClient } from './lib/client.js';

const client = new SovereignClient({
  baseURL: 'http://localhost:8000'
});

await client.connect();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'chat') {
    client.chat(request.message).then(response => {
      sendResponse({ response: response.response });
    });
    return true; // Async response
  }
});

// content.js
chrome.runtime.sendMessage({
  action: 'chat',
  message: 'Summarize this page'
}, (response) => {
  console.log('AI says:', response.response);
});
```

---

### 7. CLI Tool Integration

```bash
#!/bin/bash
# sovereign-wrapper.sh

SOVEREIGN_URL="http://localhost:8000/api"

function sovereign_chat() {
    curl -X POST "$SOVEREIGN_URL/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$1\"}" \
        | jq -r '.response'
}

function sovereign_search() {
    curl -X POST "$SOVEREIGN_URL/search" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$1\"}" \
        | jq '.results[].title'
}

# Usage
sovereign_chat "Hello!"
sovereign_search "AI news"
```

---

## Best Practices

### 1. Error Handling
```typescript
try {
  const response = await client.chat(message);
  // Handle success
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout
  } else if (error.message.includes('rate limit')) {
    // Handle rate limit
  } else {
    // Handle other errors
  }
}
```

### 2. Connection Management
```typescript
// Auto-reconnect
client.on('close', () => {
  console.log('Connection closed, reconnecting...');
  setTimeout(() => client.connect(), 5000);
});

// Heartbeat
setInterval(() => {
  client.send({ type: 'ping' });
}, 30000);
```

### 3. Caching
```typescript
const cache = new Map();

async function cachedSearch(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const result = await client.search(query);
  cache.set(query, result);
  
  // Expire after 1 hour
  setTimeout(() => cache.delete(query), 3600000);
  
  return result;
}
```

### 4. Rate Limiting
```typescript
import { RateLimiter } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiter({
  points: 10, // Number of requests
  duration: 60 // Per minute
});

async function rateLimitedChat(message: string) {
  await rateLimiter.consume('user-id');
  return await client.chat(message);
}
```

---

## Environment Variables

```bash
# .env
SOVEREIGN_OS_URL=http://localhost:8000
SOVEREIGN_OS_WS_URL=ws://localhost:8000/ws
SOVEREIGN_OS_API_KEY=optional-api-key
OLLAMA_HOST=http://localhost:11434
```

---

## Docker Integration

```yaml
# docker-compose.yml
version: '3.8'

services:
  your-app:
    build: .
    environment:
      - SOVEREIGN_OS_URL=http://sovereign-os:8000
    depends_on:
      - sovereign-os
    networks:
      - app-network
  
  sovereign-os:
    image: sovereign-os:2.1.0
    networks:
      - app-network

networks:
  app-network:
```

---

## Kubernetes Integration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-app
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: SOVEREIGN_OS_URL
          value: "http://sovereign-os.sovereign-os.svc.cluster.local"
```

---

## Testing Integration

```typescript
// Mock client for testing
import { SovereignClient } from '@sovereign-os/client';

jest.mock('@sovereign-os/client');

test('chat integration', async () => {
  const mockChat = jest.fn().mockResolvedValue({
    response: 'Hello!'
  });
  
  SovereignClient.prototype.chat = mockChat;
  
  const client = new SovereignClient();
  const result = await client.chat('Hi');
  
  expect(result.response).toBe('Hello!');
  expect(mockChat).toHaveBeenCalledWith('Hi');
});
```

---

## Monitoring Integration

```typescript
// Add metrics
client.on('chat:completed', (data) => {
  metrics.increment('sovereign.chat.completed');
  metrics.timing('sovereign.chat.duration', data.duration);
});

client.on('error', (error) => {
  metrics.increment('sovereign.errors');
  logger.error('Sovereign OS error:', error);
});
```

---

## Security Considerations

1. **API Keys**: Use environment variables, never hardcode
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement client-side rate limiting
4. **Input Validation**: Validate all inputs before sending
5. **Error Messages**: Don't expose sensitive info in errors

---

For more examples, see the `examples/` directory in the repository.
