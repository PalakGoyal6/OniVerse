"""Agmarknet market commodity pricing router."""

from typing import Optional
from fastapi import APIRouter, Query
from ..services.price_service import get_indicative_prices

router = APIRouter(prefix="/prices", tags=["Mandi Prices"])


@router.get("")
def get_mandi_prices(
    commodity: str = Query("Onion"),
    market: str = Query("Lasalgaon"),
):
    """
    Returns cached indicative prices from Agmarknet portal.
    Guaranteed graceful fallback so price fetching never blocks grading.
    """
    return get_indicative_prices(commodity=commodity, market=market)
