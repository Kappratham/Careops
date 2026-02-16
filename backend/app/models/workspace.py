import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Text, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class WorkspaceStatus(str, enum.Enum):
    SETUP = "setup"
    ACTIVE = "active"
    INACTIVE = "inactive"


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        SAEnum(WorkspaceStatus, name="workspace_status", create_constraint=True),
        default=WorkspaceStatus.SETUP,
        nullable=False,
    )
    onboarding_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    contact_form_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    welcome_message_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("User", back_populates="workspace", foreign_keys="User.workspace_id")
    contacts = relationship("Contact", back_populates="workspace")
    services = relationship("Service", back_populates="workspace")
    bookings = relationship("Booking", back_populates="workspace")
    integrations = relationship("Integration", back_populates="workspace")
    inventory_items = relationship("InventoryItem", back_populates="workspace")
    alerts = relationship("Alert", back_populates="workspace")
    automation_logs = relationship("AutomationLog", back_populates="workspace")
    form_templates = relationship("FormTemplate", back_populates="workspace")
    conversations = relationship("Conversation", back_populates="workspace")