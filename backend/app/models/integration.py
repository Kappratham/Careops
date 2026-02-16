import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class IntegrationType(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"


class IntegrationProvider(str, enum.Enum):
    RESEND = "resend"
    TWILIO = "twilio"
    MOCK = "mock"


class IntegrationStatus(str, enum.Enum):
    ACTIVE = "active"
    FAILED = "failed"
    INACTIVE = "inactive"


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        SAEnum(IntegrationType, name="integration_type", create_constraint=True),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(
        SAEnum(IntegrationProvider, name="integration_provider", create_constraint=True),
        nullable=False,
    )
    config: Mapped[dict] = mapped_column(
        JSON, nullable=False, default=dict
    )
    status: Mapped[str] = mapped_column(
        SAEnum(IntegrationStatus, name="integration_status", create_constraint=True),
        default=IntegrationStatus.INACTIVE,
        nullable=False,
    )
    last_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    workspace = relationship("Workspace", back_populates="integrations")