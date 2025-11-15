import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ENCRYPTION_KEY = os.getenv('ENCRYPTION_MASTER_KEY', 'dev-master-key-change-in-production-32bytes!!!')

def get_master_key() -> bytes:
    if len(ENCRYPTION_KEY) < 32:
        key = ENCRYPTION_KEY.ljust(32, '0')
    else:
        key = ENCRYPTION_KEY[:32]
    return key.encode('utf-8')

def encrypt_data(plaintext: str) -> str:
    if not plaintext:
        return plaintext
    
    try:
        key = get_master_key()
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        
        encrypted_data = nonce + ciphertext
        return base64.b64encode(encrypted_data).decode('utf-8')
    except Exception as e:
        print(f"Encryption error: {e}")
        return plaintext

def decrypt_data(encrypted: str) -> str:
    if not encrypted:
        return encrypted
    
    try:
        key = get_master_key()
        aesgcm = AESGCM(key)
        
        encrypted_data = base64.b64decode(encrypted.encode('utf-8'))
        
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return encrypted

def encrypt_field(data: dict, field: str) -> dict:
    if field in data and data[field]:
        data[f"{field}_encrypted"] = encrypt_data(str(data[field]))
        del data[field]
    return data

def decrypt_field(data: dict, field: str) -> dict:
    encrypted_field = f"{field}_encrypted"
    if encrypted_field in data and data[encrypted_field]:
        data[field] = decrypt_data(data[encrypted_field])
        del data[encrypted_field]
    return data
