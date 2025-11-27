from dataclasses import dataclass
from enum import Enum

class WBEnvironment(Enum):
    PRODUCTION = "production"
    SANDBOX = "sandbox"

class WBApiCategory(Enum):
    CONTENT = "content"
    ANALYTICS = "analytics"
    PRICES = "prices"
    MARKETPLACE = "marketplace"
    STATISTICS = "statistics"
    ADVERT = "advert"
    FEEDBACKS = "feedbacks"
    CHAT = "chat"
    SUPPLIES = "supplies"
    RETURNS = "returns"
    DOCUMENTS = "documents"
    FINANCE = "finance"
    COMMON = "common"

@dataclass
class WBEndpointConfig:
    production: str
    sandbox: str = None

# Конфигурация всех эндпоинтов WB
WB_API_CONFIG = {
    WBApiCategory.CONTENT: WBEndpointConfig(
        production="https://content-api.wildberries.ru",
        sandbox="https://content-api-sandbox.wildberries.ru"
    ),
    WBApiCategory.ANALYTICS: WBEndpointConfig(
        production="https://seller-analytics-api.wildberries.ru"
    ),
    WBApiCategory.PRICES: WBEndpointConfig(
        production="https://discounts-prices-api.wildberries.ru",
        sandbox="https://discounts-prices-api-sandbox.wildberries.ru"
    ),
    WBApiCategory.MARKETPLACE: WBEndpointConfig(
        production="https://marketplace-api.wildberries.ru"
    ),
    WBApiCategory.STATISTICS: WBEndpointConfig(
        production="https://statistics-api.wildberries.ru",
        sandbox="https://statistics-api-sandbox.wildberries.ru"
    ),
    WBApiCategory.ADVERT: WBEndpointConfig(
        production="https://advert-api.wildberries.ru",
        sandbox="https://advert-api-sandbox.wildberries.ru"
    ),
    WBApiCategory.FEEDBACKS: WBEndpointConfig(
        production="https://feedbacks-api.wildberries.ru",
        sandbox="https://feedbacks-api-sandbox.wildberries.ru"
    ),
    WBApiCategory.CHAT: WBEndpointConfig(
        production="https://buyer-chat-api.wildberries.ru"
    ),
    WBApiCategory.SUPPLIES: WBEndpointConfig(
        production="https://supplies-api.wildberries.ru"
    ),
    WBApiCategory.RETURNS: WBEndpointConfig(
        production="https://returns-api.wildberries.ru"
    ),
    WBApiCategory.DOCUMENTS: WBEndpointConfig(
        production="https://documents-api.wildberries.ru"
    ),
    WBApiCategory.FINANCE: WBEndpointConfig(
        production="https://finance-api.wildberries.ru"
    ),
    WBApiCategory.COMMON: WBEndpointConfig(
        production="https://common-api.wildberries.ru"
    )
}