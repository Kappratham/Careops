from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    print("✅ Database tables created")
    yield
    print("👋 Shutting down")


app = FastAPI(
    title="CareOps Platform",
    description="Unified Operations Platform for Service Businesses",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "careops-api"}


from app.routers import auth, workspace, operations, forms, inventory, dashboard, public

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(workspace.router, prefix="/api/workspace", tags=["Workspace"])
app.include_router(operations.router, prefix="/api", tags=["Operations"])
app.include_router(forms.router, prefix="/api/forms", tags=["Forms"])
app.include_router(inventory.router, prefix="/api", tags=["Inventory"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(public.router, prefix="/api/public", tags=["Public"])