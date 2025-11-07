/**
 * Token Encryption Service
 *
 * Criptografia AES-256-GCM para proteger tokens OAuth das redes sociais
 * Tokens NUNCA devem ser armazenados em plain text no banco de dados
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Número de iterações para PBKDF2
const PBKDF2_ITERATIONS = 100000;

export class TokenEncryptionService {
  private encryptionKey: Buffer;

  constructor() {
    // Obter chave de criptografia do ambiente
    const keyFromEnv = process.env.TOKEN_ENCRYPTION_KEY;

    if (!keyFromEnv) {
      console.warn('⚠️  TOKEN_ENCRYPTION_KEY not set! Using default key (INSECURE)');
      // Chave padrão APENAS para desenvolvimento
      // EM PRODUÇÃO, SEMPRE use uma chave forte no .env
      this.encryptionKey = Buffer.from('default-insecure-key-change-this-in-production-please!');
    } else {
      this.encryptionKey = Buffer.from(keyFromEnv);
    }

    // Verificar se a chave tem tamanho adequado
    if (this.encryptionKey.length < 32) {
      console.warn('⚠️  TOKEN_ENCRYPTION_KEY is too short! Deriving key...');
      this.encryptionKey = this.deriveKey(this.encryptionKey.toString());
    }
  }

  /**
   * Criptografar token
   *
   * Retorna: base64(salt + iv + tag + encrypted)
   */
  encrypt(plainText: string): string {
    try {
      // Gerar salt e IV aleatórios
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derivar chave a partir da chave principal + salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        'sha512'
      );

      // Criar cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Criptografar
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Obter tag de autenticação
      const tag = cipher.getAuthTag();

      // Combinar: salt + iv + tag + encrypted
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex'),
      ]);

      // Retornar como base64
      return combined.toString('base64');
    } catch (error: any) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Descriptografar token
   */
  decrypt(encryptedText: string): string {
    try {
      // Decodificar base64
      const combined = Buffer.from(encryptedText, 'base64');

      // Extrair componentes
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = combined.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + TAG_LENGTH
      );
      const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

      // Derivar chave a partir da chave principal + salt
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        'sha512'
      );

      // Criar decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      // Descriptografar
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Derivar chave a partir de uma string
   */
  private deriveKey(password: string): Buffer {
    const salt = crypto.createHash('sha256').update('token-encryption-salt').digest();

    return crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
  }

  /**
   * Verificar se um token criptografado é válido
   */
  isValid(encryptedText: string): boolean {
    try {
      this.decrypt(encryptedText);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gerar chave de criptografia aleatória (para .env)
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }
}

// Exportar instância singleton
export const tokenEncryption = new TokenEncryptionService();

// Helper: Gerar nova chave se executado diretamente
if (require.main === module) {
  console.log('\n🔑 Generated TOKEN_ENCRYPTION_KEY:');
  console.log(TokenEncryptionService.generateEncryptionKey());
  console.log('\n📝 Add this to your .env file:');
  console.log(`TOKEN_ENCRYPTION_KEY=${TokenEncryptionService.generateEncryptionKey()}\n`);
}
