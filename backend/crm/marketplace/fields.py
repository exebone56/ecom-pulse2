from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

def get_fernet():
    """Получение Fernet-инстанса из настроек"""
    return Fernet(settings.ENCRYPTION_KEY.encode())

class EncryptedTextField(models.TextField):
    """Поле для прозрачного шифрования/расшифровки текста"""
    
    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
    
        if not value.startswith("gAAAAAB"):
            logger.warning(f"Found unencrypted value in encrypted field. Value starts with: {value[:20]}")
            return value
        
        try:
            fernet = get_fernet()
            decrypted = fernet.decrypt(value.encode('utf-8'))
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Ошибка расшифровки: {e} | Значение: {value[:20]}...")
            return ""

    def to_python(self, value):
        if isinstance(value, str) or value is None:
            return value
        return self.from_db_value(value, None, None)

    def get_prep_value(self, value):
        if value is None:
            return value
        try:
            fernet = get_fernet()
            encrypted = fernet.encrypt(value.encode('utf-8'))
            return encrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Ошибка шифрования: {e}")
            return ""