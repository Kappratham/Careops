"""
Dashboard API: aggregated stats, today's/upcoming bookings, alerts, and automation logs.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas import (
    DashboardResponse,
    DashboardStats,
    DashboardBooking,
    DashboardAlert,
    AutomationLogResponse,
    AutomationLogListResponse,
)
from app.services.services import get_dashboard_data, get_automation_logs, check_overdue_forms
from app.utils.deps import get_current_user

router = APIRouter(prefix="", tags=["Dashboard"])


def _require_workspace(user: User) -> None:
    """Raise 403 if user has no workspace (forbidden, not 404)."""
    if not user.workspace_id:
        raise HTTPException(
            status_code=403,
            detail="No workspace associated with your account. Complete onboarding first.",
        )


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Get dashboard data",
    description="Returns aggregated stats, today's and upcoming bookings, and recent alerts for the current workspace. Optionally runs overdue-form checks.",
)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_workspace(current_user)

    await check_overdue_forms(db, current_user.workspace_id)
    data = await get_dashboard_data(db, current_user.workspace_id)

    return DashboardResponse(
        stats=DashboardStats(**data["stats"]),
        todays_bookings=[DashboardBooking(**b) for b in data["todays_bookings"]],
        upcoming_bookings=[DashboardBooking(**b) for b in data["upcoming_bookings"]],
        recent_alerts=[DashboardAlert(**a) for a in data["recent_alerts"]],
    )


@router.get(
    "/automations/logs",
    response_model=AutomationLogListResponse,
    summary="List automation logs",
    description="Returns recent automation logs for the workspace (e.g. emails sent, form overdue actions).",
)
async def list_automation_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_workspace(current_user)

    logs = await get_automation_logs(db, current_user.workspace_id)
    return AutomationLogListResponse(
        logs=[AutomationLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )