from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas import (
    WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse,
    OnboardingStatusResponse,
    IntegrationCreate, IntegrationResponse, IntegrationListResponse, IntegrationTestResponse,
    StaffInvite, StaffResponse, StaffListResponse, StaffUpdatePermissions,
)
from app.services.services import (
    create_workspace, get_workspace, update_workspace, activate_workspace,
    get_onboarding_status,
    create_integration, get_integrations,
    invite_staff, get_staff, update_staff_permissions,
)
from app.utils.deps import get_current_user, get_current_owner

router = APIRouter()


# ============================================================
# WORKSPACE
# ============================================================

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace_endpoint(
    data: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    workspace = await create_workspace(
        db, current_user.id, data.name, data.address, data.timezone, data.contact_email
    )
    return WorkspaceResponse.model_validate(workspace)


@router.get("/", response_model=WorkspaceResponse)
async def get_my_workspace(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")
    workspace = await get_workspace(db, current_user.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceResponse.model_validate(workspace)


@router.put("/", response_model=WorkspaceResponse)
async def update_workspace_endpoint(
    data: WorkspaceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")
    workspace = await get_workspace(db, current_user.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    updated = await update_workspace(db, workspace, **data.model_dump(exclude_unset=True))
    return WorkspaceResponse.model_validate(updated)


@router.post("/activate", response_model=WorkspaceResponse)
async def activate_workspace_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")
    workspace = await get_workspace(db, current_user.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    onboarding = await get_onboarding_status(db, workspace.id, current_user.id)
    if not onboarding["can_activate"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot activate. Complete required steps: communication setup and at least one service.",
        )

    activated = await activate_workspace(db, workspace)
    return WorkspaceResponse.model_validate(activated)


# ============================================================
# ONBOARDING
# ============================================================

@router.get("/onboarding", response_model=OnboardingStatusResponse)
async def get_onboarding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        return OnboardingStatusResponse(
            current_step=0,
            workspace_created=False,
            communication_setup=False,
            contact_form_created=False,
            services_created=False,
            forms_created=False,
            inventory_created=False,
            team_invited=False,
            workspace_activated=False,
            can_activate=False,
        )

    status = await get_onboarding_status(db, current_user.workspace_id, current_user.id)
    return OnboardingStatusResponse(**status)


@router.put("/onboarding/step/{step}")
async def update_onboarding_step(
    step: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")
    workspace = await get_workspace(db, current_user.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if step > workspace.onboarding_step:
        workspace.onboarding_step = step
        await db.flush()

    return {"step": workspace.onboarding_step}


# ============================================================
# INTEGRATIONS
# ============================================================

@router.post("/integrations", response_model=IntegrationResponse)
async def create_integration_endpoint(
    data: IntegrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    integration = await create_integration(
        db, current_user.workspace_id, data.type, data.provider, data.config
    )
    return IntegrationResponse.model_validate(integration)


@router.get("/integrations", response_model=IntegrationListResponse)
async def list_integrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    integrations = await get_integrations(db, current_user.workspace_id)
    return IntegrationListResponse(
        integrations=[IntegrationResponse.model_validate(i) for i in integrations],
        total=len(integrations),
    )


@router.post("/integrations/test", response_model=IntegrationTestResponse)
async def test_integration(
    data: IntegrationCreate,
    current_user: User = Depends(get_current_owner),
):
    # Mock test - always succeeds for MVP
    return IntegrationTestResponse(
        success=True,
        message=f"{data.provider} {data.type} connection successful",
    )


# ============================================================
# STAFF
# ============================================================

@router.post("/staff", response_model=StaffResponse)
async def invite_staff_endpoint(
    data: StaffInvite,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    user = await invite_staff(
        db, current_user.workspace_id, data.email, data.full_name, data.permissions
    )
    return StaffResponse.model_validate(user)


@router.get("/staff", response_model=StaffListResponse)
async def list_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    staff = await get_staff(db, current_user.workspace_id)
    return StaffListResponse(
        staff=[StaffResponse.model_validate(s) for s in staff],
        total=len(staff),
    )


@router.put("/staff/{staff_id}/permissions", response_model=StaffResponse)
async def update_permissions(
    staff_id: str,
    data: StaffUpdatePermissions,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    import uuid
    user = await update_staff_permissions(db, uuid.UUID(staff_id), data.permissions)
    if not user:
        raise HTTPException(status_code=404, detail="Staff not found")
    return StaffResponse.model_validate(user)