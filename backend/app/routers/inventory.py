from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse, InventoryListResponse,
    AlertResponse, AlertListResponse,
)
from app.services.services import (
    create_inventory_item, get_inventory_items, update_inventory_item,
    get_alerts, dismiss_alert,
)
from app.utils.deps import get_current_user, get_current_owner
import uuid

router = APIRouter()


# ============================================================
# INVENTORY
# ============================================================

@router.post("/inventory", response_model=InventoryItemResponse)
async def create_item(
    data: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    item = await create_inventory_item(
        db, current_user.workspace_id, data.model_dump()
    )
    return InventoryItemResponse(
        **{
            "id": item.id,
            "workspace_id": item.workspace_id,
            "name": item.name,
            "unit": item.unit,
            "current_quantity": item.current_quantity,
            "low_threshold": item.low_threshold,
            "usage_per_booking": item.usage_per_booking,
            "is_active": item.is_active,
            "is_low_stock": item.current_quantity <= item.low_threshold,
            "is_critical": item.current_quantity == 0,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
    )


@router.get("/inventory", response_model=InventoryListResponse)
async def list_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    items = await get_inventory_items(db, current_user.workspace_id)
    low_stock = sum(1 for i in items if i["is_low_stock"] and not i["is_critical"])
    critical = sum(1 for i in items if i["is_critical"])

    return InventoryListResponse(
        items=[InventoryItemResponse(**i) for i in items],
        total=len(items),
        low_stock_count=low_stock,
        critical_count=critical,
    )


@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_item(
    item_id: str,
    data: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    item = await update_inventory_item(
        db, uuid.UUID(item_id), data.model_dump(exclude_unset=True)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return InventoryItemResponse(
        **{
            "id": item.id,
            "workspace_id": item.workspace_id,
            "name": item.name,
            "unit": item.unit,
            "current_quantity": item.current_quantity,
            "low_threshold": item.low_threshold,
            "usage_per_booking": item.usage_per_booking,
            "is_active": item.is_active,
            "is_low_stock": item.current_quantity <= item.low_threshold,
            "is_critical": item.current_quantity == 0,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
    )


@router.delete("/inventory/{item_id}")
async def delete_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    from sqlalchemy import select
    from app.models.inventory import InventoryItem

    result = await db.execute(
        select(InventoryItem).where(InventoryItem.id == uuid.UUID(item_id))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.flush()
    return {"message": "Item deleted"}


# ============================================================
# ALERTS
# ============================================================

@router.get("/alerts", response_model=AlertListResponse)
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    alerts = await get_alerts(db, current_user.workspace_id)
    return AlertListResponse(
        alerts=[AlertResponse.model_validate(a) for a in alerts],
        total=len(alerts),
    )


@router.put("/alerts/{alert_id}/dismiss")
async def dismiss_alert_endpoint(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = await dismiss_alert(db, uuid.UUID(alert_id))
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert dismissed"}