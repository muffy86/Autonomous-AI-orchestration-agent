/**
 * Personal Knowledge Graph - Sovereign Data Storage
 * All your data, locally stored, fully encrypted, you own it
 */

export class PersonalKnowledgeGraph {
  private nodes: Map<string, any> = new Map();
  private edges: Map<string, Set<string>> = new Map();
  private vectorStore: any;
  private dataLayer: any;

  constructor(dataLayer: any) {
    this.dataLayer = dataLayer;
  }

  async init() {
    // Load existing graph from local storage
    const saved = await this.dataLayer.load('knowledge-graph');
    if (saved) {
      this.nodes = new Map(saved.nodes);
      this.edges = new Map(saved.edges.map(([k, v]: any) => [k, new Set(v)]));
    }

    // Initialize vector embeddings for semantic search
    this.vectorStore = await this.initVectorStore();
    
    console.log('✅ Knowledge Graph initialized');
  }

  async initVectorStore() {
    // Use local embedding model (all-MiniLM-L6-v2 via ONNX)
    return {
      embeddings: new Map(),
      
      async add(id: string, text: string) {
        const embedding = await this.createEmbedding(text);
        this.embeddings.set(id, { text, embedding });
      },
      
      async search(query: string, k = 5) {
        const queryEmbedding = await this.createEmbedding(query);
        const scores = [];
        
        for (const [id, data] of this.embeddings) {
          const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
          scores.push({ id, score: similarity, text: data.text });
        }
        
        return scores.sort((a, b) => b.score - a.score).slice(0, k);
      },
      
      async createEmbedding(text: string) {
        // Simple embedding (in production, use actual model)
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(384).fill(0);
        
        words.forEach((word, i) => {
          const hash = this.hash(word);
          embedding[hash % 384] += 1;
        });
        
        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / (magnitude || 1));
      },
      
      cosineSimilarity(a: number[], b: number[]) {
        const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dot / (magA * magB || 1);
      },
      
      hash(str: string) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash = hash & hash;
        }
        return Math.abs(hash);
      }
    };
  }

  // ===== Core Operations =====

  async addNode(data: any) {
    const id = data.id || this.generateId();
    
    const node = {
      id,
      type: data.type || 'entity',
      content: data.content || data,
      metadata: {
        created: Date.now(),
        updated: Date.now(),
        ...data.metadata
      }
    };
    
    this.nodes.set(id, node);
    
    // Add to vector store for semantic search
    const text = this.nodeToText(node);
    await this.vectorStore.add(id, text);
    
    // Auto-persist
    await this.save();
    
    return id;
  }

  async addEdge(from: string, to: string, type = 'relates') {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    
    this.edges.get(from)!.add(`${type}:${to}`);
    
    await this.save();
  }

  async query(query: string, options = {}) {
    // Semantic search
    const results = await this.vectorStore.search(query, options.limit || 10);
    
    // Get full nodes
    return results.map((r: any) => ({
      ...this.nodes.get(r.id),
      score: r.score
    }));
  }

  async getNode(id: string) {
    return this.nodes.get(id);
  }

  async getConnected(id: string, type?: string) {
    const edges = this.edges.get(id) || new Set();
    const connected = [];
    
    for (const edge of edges) {
      const [edgeType, targetId] = edge.split(':');
      if (!type || edgeType === type) {
        connected.push({
          type: edgeType,
          node: this.nodes.get(targetId)
        });
      }
    }
    
    return connected;
  }

  // ===== Learning & Optimization =====

  async learn(data: any) {
    // Extract entities and relationships
    const entities = await this.extractEntities(data);
    const relationships = await this.extractRelationships(data);
    
    // Add to graph
    const nodeIds = [];
    for (const entity of entities) {
      const id = await this.addNode(entity);
      nodeIds.push(id);
    }
    
    for (const rel of relationships) {
      await this.addEdge(rel.from, rel.to, rel.type);
    }
    
    return { entities: nodeIds.length, relationships: relationships.length };
  }

  async extractEntities(data: any) {
    // Simple entity extraction (in production, use NER model)
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const entities = [];
    
    // Extract capitalized words as entities
    const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
    const unique = [...new Set(words)];
    
    for (const word of unique) {
      entities.push({
        type: 'entity',
        content: { name: word, source: 'extraction' }
      });
    }
    
    return entities;
  }

  async extractRelationships(data: any) {
    // Simple relationship extraction
    // In production, use proper NLP
    return [];
  }

  async optimize() {
    // Remove redundant nodes
    const nodeArray = Array.from(this.nodes.entries());
    
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const [id1, node1] = nodeArray[i];
        const [id2, node2] = nodeArray[j];
        
        const similarity = await this.calculateSimilarity(node1, node2);
        
        if (similarity > 0.95) {
          // Merge nodes
          await this.mergeNodes(id1, id2);
        }
      }
    }
    
    await this.save();
  }

  async calculateSimilarity(node1: any, node2: any) {
    const text1 = this.nodeToText(node1);
    const text2 = this.nodeToText(node2);
    
    const emb1 = await this.vectorStore.createEmbedding(text1);
    const emb2 = await this.vectorStore.createEmbedding(text2);
    
    return this.vectorStore.cosineSimilarity(emb1, emb2);
  }

  async mergeNodes(id1: string, id2: string) {
    const node1 = this.nodes.get(id1);
    const node2 = this.nodes.get(id2);
    
    // Merge content
    const merged = {
      ...node1,
      content: { ...node1.content, ...node2.content },
      metadata: {
        ...node1.metadata,
        merged: [node2.id],
        updated: Date.now()
      }
    };
    
    this.nodes.set(id1, merged);
    this.nodes.delete(id2);
    
    // Update edges
    const edges2 = this.edges.get(id2) || new Set();
    const edges1 = this.edges.get(id1) || new Set();
    
    for (const edge of edges2) {
      edges1.add(edge);
    }
    
    this.edges.set(id1, edges1);
    this.edges.delete(id2);
  }

  // ===== Persistence =====

  async save() {
    await this.dataLayer.save('knowledge-graph', {
      nodes: Array.from(this.nodes.entries()),
      edges: Array.from(this.edges.entries()).map(([k, v]) => [k, Array.from(v)])
    });
  }

  // ===== Export/Import =====

  async export(format = 'json') {
    if (format === 'json') {
      return JSON.stringify({
        nodes: Array.from(this.nodes.entries()),
        edges: Array.from(this.edges.entries()).map(([k, v]) => [k, Array.from(v)]),
        metadata: {
          version: '1.0',
          exported: Date.now(),
          nodeCount: this.nodes.size,
          edgeCount: this.edges.size
        }
      }, null, 2);
    }
    
    if (format === 'graphml') {
      return this.toGraphML();
    }
    
    if (format === 'cypher') {
      return this.toCypher();
    }
  }

  async import(data: string, format = 'json') {
    if (format === 'json') {
      const parsed = JSON.parse(data);
      this.nodes = new Map(parsed.nodes);
      this.edges = new Map(parsed.edges.map(([k, v]: any) => [k, new Set(v)]));
      await this.save();
    }
  }

  toGraphML() {
    // Convert to GraphML format for visualization
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    xml += '  <graph id="G" edgedefault="directed">\n';
    
    // Nodes
    for (const [id, node] of this.nodes) {
      xml += `    <node id="${id}">\n`;
      xml += `      <data key="type">${node.type}</data>\n`;
      xml += `      <data key="content">${JSON.stringify(node.content)}</data>\n`;
      xml += `    </node>\n`;
    }
    
    // Edges
    for (const [from, edges] of this.edges) {
      for (const edge of edges) {
        const [type, to] = edge.split(':');
        xml += `    <edge source="${from}" target="${to}">\n`;
        xml += `      <data key="type">${type}</data>\n`;
        xml += `    </edge>\n`;
      }
    }
    
    xml += '  </graph>\n';
    xml += '</graphml>';
    
    return xml;
  }

  toCypher() {
    // Convert to Cypher queries for Neo4j
    let cypher = '// Knowledge Graph Export\n\n';
    
    // Create nodes
    for (const [id, node] of this.nodes) {
      cypher += `CREATE (n_${id}:${node.type} {id: "${id}", content: ${JSON.stringify(node.content)}})\n`;
    }
    
    cypher += '\n';
    
    // Create relationships
    for (const [from, edges] of this.edges) {
      for (const edge of edges) {
        const [type, to] = edge.split(':');
        cypher += `MATCH (a {id: "${from}"}), (b {id: "${to}"})\n`;
        cypher += `CREATE (a)-[:${type.toUpperCase()}]->(b)\n`;
      }
    }
    
    return cypher;
  }

  // ===== Utility =====

  nodeToText(node: any) {
    return JSON.stringify(node.content);
  }

  generateId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== Statistics =====

  stats() {
    return {
      nodes: this.nodes.size,
      edges: Array.from(this.edges.values()).reduce((sum, set) => sum + set.size, 0),
      types: [...new Set(Array.from(this.nodes.values()).map(n => n.type))]
    };
  }
}

export default PersonalKnowledgeGraph;
