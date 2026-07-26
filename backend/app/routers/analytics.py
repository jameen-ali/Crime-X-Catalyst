from fastapi import APIRouter
from app.data.mock_data import (
    MOCK_FIRS, MOCK_KPIS, LIVE_ACTIVITY_ITEMS,
    get_crime_trend, get_hourly_trend, get_crime_distribution,
    get_district_comparison, get_weapon_analysis, get_age_distribution, get_gender_distribution,
)

router = APIRouter()


@router.get("/kpis")
async def get_kpis():
    return MOCK_KPIS


@router.get("/crime-trend")
async def crime_trend():
    return get_crime_trend()


@router.get("/hourly-trend")
async def hourly_trend():
    return get_hourly_trend()


@router.get("/crime-distribution")
async def crime_distribution():
    return get_crime_distribution()


@router.get("/district-comparison")
async def district_comparison():
    return get_district_comparison()


@router.get("/weapon-analysis")
async def weapon_analysis():
    return get_weapon_analysis()


@router.get("/age-distribution")
async def age_distribution():
    return get_age_distribution()


@router.get("/gender-distribution")
async def gender_distribution():
    return get_gender_distribution()


@router.get("/activity-feed")
async def activity_feed():
    return LIVE_ACTIVITY_ITEMS


@router.get("/heatmap")
async def heatmap():
    severity_map = {"Critical": 1.0, "High": 0.7, "Medium": 0.4, "Low": 0.2}
    return [
        {"lat": f["latitude"], "lng": f["longitude"], "intensity": severity_map.get(f["severity"], 0.2)}
        for f in MOCK_FIRS
    ]
