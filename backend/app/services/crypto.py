"""Cryptographic operations: canonical JSON SHA-256 hashing and Ed25519 signature verification."""

import json
import hashlib
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519


def compute_canonical_hash(payload: Dict[str, Any]) -> str:
    """
    Computes SHA-256 hash of canonical JSON (alphabetically sorted keys, no whitespace).
    This guarantees 100% deterministic hash output across Android Dart and Python.
    """
    canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


def verify_ed25519_signature(
    public_key_hex: str,
    message_hex_or_str: str,
    signature_hex: str,
) -> bool:
    """
    Verifies Ed25519 signature against the message (or report_hash).
    """
    try:
        pub_bytes = bytes.fromhex(public_key_hex)
        sig_bytes = bytes.fromhex(signature_hex)
        
        # If message is a 64-char hex hash, verify the raw bytes or utf-8 string
        msg_bytes = message_hex_or_str.encode("utf-8")

        public_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
        public_key.verify(sig_bytes, msg_bytes)
        return True
    except Exception:
        # Fallback test if message was verified as hex bytes
        try:
            msg_bytes = bytes.fromhex(message_hex_or_str)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
            public_key.verify(bytes.fromhex(signature_hex), msg_bytes)
            return True
        except Exception:
            return False


def generate_dev_keypair() -> Tuple[str, str]:
    """Generates an Ed25519 test keypair (private_hex, public_hex)."""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    from cryptography.hazmat.primitives import serialization
    priv_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return priv_bytes.hex(), pub_bytes.hex()


def sign_canonical_hash(private_key_hex: str, report_hash_hex: str) -> str:
    """Signs report hash with Ed25519 private key."""
    priv_bytes = bytes.fromhex(private_key_hex)
    private_key = ed25519.Ed25519PrivateKey.from_bytes(priv_bytes)
    sig = private_key.sign(report_hash_hex.encode("utf-8"))
    return sig.hex()


# Convenience aliases
generate_ed25519_keypair = generate_dev_keypair
sign_hash_ed25519 = sign_canonical_hash
