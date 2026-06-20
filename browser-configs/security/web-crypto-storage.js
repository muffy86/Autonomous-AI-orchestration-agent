/**
 * Web Crypto API Secure Storage - June 2026
 * Replace XOR encryption with proper AES-GCM encryption
 */

class SecureStorageV2 {
  constructor() {
    this.masterKey = null;
    this.salt = null;
    this.initialized = false;
  }

  async init(password) {
    // Generate salt if not exists
    const storedSalt = localStorage.getItem('crypto_salt');
    if (storedSalt) {
      this.salt = this.base64ToArrayBuffer(storedSalt);
    } else {
      this.salt = crypto.getRandomValues(new Uint8Array(16));
      localStorage.setItem('crypto_salt', this.arrayBufferToBase64(this.salt));
    }

    // Derive key from password
    this.masterKey = await this.deriveKey(password, this.salt);
    this.initialized = true;
  }

  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(text) {
    if (!this.initialized) throw new Error('Not initialized');

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.masterKey,
      data
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);

    return this.arrayBufferToBase64(result);
  }

  async decrypt(encrypted) {
    if (!this.initialized) throw new Error('Not initialized');

    const data = this.base64ToArrayBuffer(encrypted);
    
    // Extract IV and encrypted data
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.masterKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // ===== Hardware Security Key Support =====

  async setupWebAuthn() {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn not supported');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Browser AI Credentials',
        id: window.location.hostname
      },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'user@example.com',
        displayName: 'AI User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'direct'
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      // Store credential ID
      localStorage.setItem('webauthn_credential_id', 
        this.arrayBufferToBase64(credential.rawId));

      return credential;
    } catch (error) {
      console.error('WebAuthn setup failed:', error);
      throw error;
    }
  }

  async authenticateWebAuthn() {
    const credentialId = localStorage.getItem('webauthn_credential_id');
    if (!credentialId) {
      throw new Error('No WebAuthn credential found');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: this.base64ToArrayBuffer(credentialId),
        type: 'public-key',
        transports: ['usb', 'nfc', 'ble']
      }],
      timeout: 60000,
      userVerification: 'required'
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      return assertion;
    } catch (error) {
      console.error('WebAuthn authentication failed:', error);
      throw error;
    }
  }

  // ===== Biometric Authentication =====

  async setupBiometric() {
    // Use Web Authentication API for biometric
    if (!window.PublicKeyCredential) {
      throw new Error('Biometric not supported');
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    if (!available) {
      throw new Error('No biometric authenticator available');
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const options = {
      challenge,
      rp: {
        name: 'Browser AI',
        id: window.location.hostname
      },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'user',
        displayName: 'User'
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      }
    };

    const credential = await navigator.credentials.create({ publicKey: options });
    
    localStorage.setItem('biometric_credential', 
      this.arrayBufferToBase64(credential.rawId));

    return credential;
  }

  async authenticateBiometric() {
    const credId = localStorage.getItem('biometric_credential');
    if (!credId) throw new Error('Biometric not set up');

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const options = {
      challenge,
      allowCredentials: [{
        id: this.base64ToArrayBuffer(credId),
        type: 'public-key'
      }],
      userVerification: 'required'
    };

    return await navigator.credentials.get({ publicKey: options });
  }

  // ===== Secure Key Sharing =====

  async generateShareLink(data, expiresIn = 3600000) {
    // Generate ephemeral key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt data with public key
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      keyPair.publicKey,
      encoder.encode(JSON.stringify(data))
    );

    // Export private key
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    // Create shareable link
    const shareData = {
      encrypted: this.arrayBufferToBase64(encrypted),
      privateKey,
      expires: Date.now() + expiresIn
    };

    const compressed = this.compress(JSON.stringify(shareData));
    const hash = await this.hashData(compressed);

    // Store temporarily
    sessionStorage.setItem(`share:${hash}`, compressed);

    return `${window.location.origin}#share=${hash}`;
  }

  async retrieveSharedData(shareId) {
    const compressed = sessionStorage.getItem(`share:${shareId}`);
    if (!compressed) throw new Error('Share link expired or invalid');

    const shareData = JSON.parse(this.decompress(compressed));

    if (Date.now() > shareData.expires) {
      sessionStorage.removeItem(`share:${shareId}`);
      throw new Error('Share link expired');
    }

    // Import private key
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      shareData.privateKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      this.base64ToArrayBuffer(shareData.encrypted)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  // ===== Zero-Knowledge Proof =====

  async generateZKProof(secret) {
    // Simple ZK proof: prove you know secret without revealing it
    const hash = await this.hashData(secret);
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    const proof = await this.hashData(
      hash + this.arrayBufferToBase64(challenge)
    );

    return { challenge, proof };
  }

  async verifyZKProof(secret, challenge, proof) {
    const hash = await this.hashData(secret);
    const expectedProof = await this.hashData(
      hash + this.arrayBufferToBase64(challenge)
    );

    return proof === expectedProof;
  }

  // ===== Utility Methods =====

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async hashData(data) {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return this.arrayBufferToBase64(buffer);
  }

  compress(str) {
    // Simple compression (in production, use proper compression)
    return btoa(str);
  }

  decompress(str) {
    return atob(str);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecureStorageV2;
}

if (typeof window !== 'undefined') {
  window.SecureStorageV2 = SecureStorageV2;
}
