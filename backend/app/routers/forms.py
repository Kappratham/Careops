from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas import (
    FormTemplateCreate, FormTemplateUpdate, FormTemplateResponse, FormTemplateListResponse,
    FormSubmissionResponse, FormSubmissionListResponse,
)
from app.services.services import (
    create_form_template, get_form_templates, get_form_submissions,
)
from app.utils.deps import get_current_user, get_current_owner
import uuid

router = APIRouter()


@router.post("/templates", response_model=FormTemplateResponse)
async def create_template(
    data: FormTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    template = await create_form_template(
        db, current_user.workspace_id, data.model_dump()
    )
    return FormTemplateResponse.model_validate(template)


@router.get("/templates", response_model=FormTemplateListResponse)
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    templates = await get_form_templates(db, current_user.workspace_id)
    return FormTemplateListResponse(
        templates=[FormTemplateResponse.model_validate(t) for t in templates],
        total=len(templates),
    )


@router.get("/submissions", response_model=FormSubmissionListResponse)
async def list_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    submissions = await get_form_submissions(db, current_user.workspace_id)
    return FormSubmissionListResponse(
        submissions=[FormSubmissionResponse(**s) for s in submissions],
        total=len(submissions),
    )