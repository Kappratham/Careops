from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import ssl


# Convert postgres:// to postgresql+asyncpg://
database_url = settings.DATABASE_URL

# Remove sslmode and channel_binding from URL (asyncpg doesn't support them)
if "?" in database_url:
    base_url = database_url.split("?")[0]
else:
    base_url = database_url

if base_url.startswith("postgres://"):
    base_url = base_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif base_url.startswith("postgresql://"):
    base_url = base_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create SSL context for Neon
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    base_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    connect_args={"ssl": ssl_context},
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)