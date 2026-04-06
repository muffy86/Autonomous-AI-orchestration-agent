/**
 * Local AI Model Runner
 * Run AI models directly in the browser using TensorFlow.js, ONNX, and WebGPU
 * 
 * Supports:
 * - Text generation (GPT-style models)
 * - Image classification and generation
 * - Embeddings and similarity search
 * - Speech recognition and synthesis
 */

class LocalAIRunner {
  constructor() {
    this.models = new Map();
    this.loadedModels = new Set();
    this.config = {
      useWebGPU: true,
      useWASM: true,
      maxConcurrent: 2,
      cachePath: 'indexeddb://models'
    };
    
    this.init();
  }

  async init() {
    console.log('🤖 Initializing Local AI Runner...');
    
    // Check for WebGPU support
    if ('gpu' in navigator) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        console.log('✅ WebGPU available');
        this.webgpuAdapter = adapter;
      }
    }
    
    // Initialize TensorFlow.js
    await this.initTensorFlow();
    
    // Initialize ONNX Runtime
    await this.initONNX();
    
    // Initialize Web Speech API
    this.initSpeech();
  }

  async initTensorFlow() {
    try {
      // Load TensorFlow.js dynamically
      if (typeof tf === 'undefined') {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
      }
      
      // Set backend to WebGPU if available
      if (this.webgpuAdapter && typeof tf !== 'undefined') {
        await tf.setBackend('webgpu');
        console.log('✅ TensorFlow.js initialized with WebGPU');
      } else if (typeof tf !== 'undefined') {
        await tf.setBackend('webgl');
        console.log('✅ TensorFlow.js initialized with WebGL');
      }
      
      return true;
    } catch (error) {
      console.error('❌ TensorFlow.js initialization failed:', error);
      return false;
    }
  }

  async initONNX() {
    try {
      if (typeof ort === 'undefined') {
        await this.loadScript('https://cdn.jsdelivr.net/npm/onnxruntime-web@latest/dist/ort.min.js');
      }
      
      if (typeof ort !== 'undefined') {
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@latest/dist/';
        console.log('✅ ONNX Runtime initialized');
      }
      
      return true;
    } catch (error) {
      console.error('❌ ONNX Runtime initialization failed:', error);
      return false;
    }
  }

  initSpeech() {
    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      console.log('✅ Speech Recognition available');
    }
    
    // Speech Synthesis
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      console.log('✅ Speech Synthesis available');
    }
  }

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ===== Model Loading =====

  async loadModel(modelName, modelUrl, type = 'tensorflow') {
    if (this.loadedModels.has(modelName)) {
      console.log(`✓ Model ${modelName} already loaded`);
      return this.models.get(modelName);
    }

    console.log(`📥 Loading model: ${modelName}...`);
    
    try {
      let model;
      
      if (type === 'tensorflow') {
        model = await tf.loadGraphModel(modelUrl);
      } else if (type === 'onnx') {
        model = await ort.InferenceSession.create(modelUrl);
      } else if (type === 'layers') {
        model = await tf.loadLayersModel(modelUrl);
      }
      
      this.models.set(modelName, { model, type });
      this.loadedModels.add(modelName);
      
      console.log(`✅ Model ${modelName} loaded successfully`);
      return model;
    } catch (error) {
      console.error(`❌ Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  // ===== Pre-configured Models =====

  async loadMobileNet() {
    // Image classification
    if (typeof tf === 'undefined') await this.initTensorFlow();
    
    await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest');
    const model = await mobilenet.load();
    this.models.set('mobilenet', { model, type: 'tfjs-model' });
    this.loadedModels.add('mobilenet');
    
    console.log('✅ MobileNet loaded');
    return model;
  }

  async loadCoco() {
    // Object detection
    if (typeof tf === 'undefined') await this.initTensorFlow();
    
    await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@latest');
    const model = await cocoSsd.load();
    this.models.set('coco-ssd', { model, type: 'tfjs-model' });
    this.loadedModels.add('coco-ssd');
    
    console.log('✅ COCO-SSD loaded');
    return model;
  }

  async loadUniversalSentenceEncoder() {
    // Text embeddings
    if (typeof tf === 'undefined') await this.initTensorFlow();
    
    await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@latest');
    const model = await use.load();
    this.models.set('use', { model, type: 'tfjs-model' });
    this.loadedModels.add('use');
    
    console.log('✅ Universal Sentence Encoder loaded');
    return model;
  }

  async loadToxicity() {
    // Toxicity detection
    if (typeof tf === 'undefined') await this.initTensorFlow();
    
    await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/toxicity@latest');
    const model = await toxicity.load(0.9);
    this.models.set('toxicity', { model, type: 'tfjs-model' });
    this.loadedModels.add('toxicity');
    
    console.log('✅ Toxicity model loaded');
    return model;
  }

  // ===== Inference Methods =====

  async classifyImage(imageElement, modelName = 'mobilenet') {
    if (!this.loadedModels.has(modelName)) {
      await this.loadMobileNet();
    }
    
    const { model } = this.models.get(modelName);
    const predictions = await model.classify(imageElement);
    
    return predictions;
  }

  async detectObjects(imageElement, modelName = 'coco-ssd') {
    if (!this.loadedModels.has(modelName)) {
      await this.loadCoco();
    }
    
    const { model } = this.models.get(modelName);
    const predictions = await model.detect(imageElement);
    
    return predictions;
  }

  async embedText(text, modelName = 'use') {
    if (!this.loadedModels.has(modelName)) {
      await this.loadUniversalSentenceEncoder();
    }
    
    const { model } = this.models.get(modelName);
    const embeddings = await model.embed(text);
    
    return embeddings;
  }

  async checkToxicity(text, modelName = 'toxicity') {
    if (!this.loadedModels.has(modelName)) {
      await this.loadToxicity();
    }
    
    const { model } = this.models.get(modelName);
    const predictions = await model.classify([text]);
    
    return predictions;
  }

  async cosineSimilarity(embedding1, embedding2) {
    // Calculate cosine similarity between two embeddings
    const dot = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const mag1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    return dot / (mag1 * mag2);
  }

  async findSimilarTexts(query, texts) {
    const embeddings = await this.embedText([query, ...texts]);
    const queryEmbedding = await embeddings.slice([0, 0], [1, -1]).array();
    const textEmbeddings = await embeddings.slice([1, 0], [-1, -1]).array();
    
    const similarities = textEmbeddings.map((embedding, i) => ({
      text: texts[i],
      similarity: this.cosineSimilarity(queryEmbedding[0], embedding)
    }));
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  // ===== Speech Methods =====

  async startVoiceRecognition() {
    return new Promise((resolve, reject) => {
      if (!this.speechRecognition) {
        reject(new Error('Speech Recognition not available'));
        return;
      }

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.speechRecognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.speechRecognition.start();
    });
  }

  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech Synthesis not available'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.lang = options.lang || 'en-US';

      if (options.voice) {
        const voices = this.speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === options.voice);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = resolve;
      utterance.onerror = reject;

      this.speechSynthesis.speak(utterance);
    });
  }

  getAvailableVoices() {
    if (!this.speechSynthesis) return [];
    return this.speechSynthesis.getVoices();
  }

  // ===== Utility Methods =====

  async preprocessImage(imageElement, targetSize = [224, 224]) {
    return tf.tidy(() => {
      let tensor = tf.browser.fromPixels(imageElement);
      
      // Resize
      tensor = tf.image.resizeBilinear(tensor, targetSize);
      
      // Normalize
      tensor = tensor.div(255.0);
      
      // Add batch dimension
      tensor = tensor.expandDims(0);
      
      return tensor;
    });
  }

  async captureScreenshot() {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const video = document.createElement('video');
      
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          video.srcObject = stream;
          video.play();
          
          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            stream.getTracks().forEach(track => track.stop());
            resolve(canvas);
          };
        });
    });
  }

  async loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // ===== Memory Management =====

  unloadModel(modelName) {
    if (!this.loadedModels.has(modelName)) return;
    
    const { model, type } = this.models.get(modelName);
    
    if (type === 'tensorflow' || type === 'layers') {
      model.dispose();
    }
    
    this.models.delete(modelName);
    this.loadedModels.delete(modelName);
    
    console.log(`🗑️ Model ${modelName} unloaded`);
  }

  getMemoryInfo() {
    if (typeof tf !== 'undefined') {
      return {
        numTensors: tf.memory().numTensors,
        numBytes: tf.memory().numBytes,
        numDataBuffers: tf.memory().numDataBuffers,
        loadedModels: Array.from(this.loadedModels)
      };
    }
    return { loadedModels: Array.from(this.loadedModels) };
  }

  cleanup() {
    // Dispose all models
    this.loadedModels.forEach(modelName => this.unloadModel(modelName));
    
    // Clear TensorFlow backend
    if (typeof tf !== 'undefined') {
      tf.disposeVariables();
    }
    
    console.log('🧹 Cleanup complete');
  }
}

// ===== Usage Examples =====

/*

// Initialize
const aiRunner = new LocalAIRunner();

// Image Classification
const img = document.querySelector('img');
const predictions = await aiRunner.classifyImage(img);
console.log('Predictions:', predictions);

// Object Detection
const objects = await aiRunner.detectObjects(img);
console.log('Detected objects:', objects);

// Text Similarity
const similar = await aiRunner.findSimilarTexts(
  'machine learning',
  ['deep learning', 'cooking recipes', 'neural networks', 'banana bread']
);
console.log('Similar texts:', similar);

// Voice Recognition
const transcript = await aiRunner.startVoiceRecognition();
console.log('You said:', transcript);

// Text to Speech
await aiRunner.speak('Hello, I am your AI assistant!');

// Toxicity Detection
const toxicityResults = await aiRunner.checkToxicity('You are amazing!');
console.log('Toxicity:', toxicityResults);

// Memory Info
console.log('Memory:', aiRunner.getMemoryInfo());

// Cleanup
aiRunner.cleanup();

*/

// Export for use in extensions/scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalAIRunner;
}
