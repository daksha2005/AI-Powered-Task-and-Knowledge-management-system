from app.db.database import engine, SessionLocal, Base
from app.models import user, task, document, activity_log  # noqa: F401 — registers all models
from app.models.user import Role, User
from app.core.security import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed roles if not present
        if not db.query(Role).filter(Role.name == "admin").first():
            admin_role = Role(name="admin")
            user_role = Role(name="user")
            db.add_all([admin_role, user_role])
            db.commit()
            db.refresh(admin_role)
            db.refresh(user_role)

        # Seed default admin user
        if not db.query(User).filter(User.email == "admin@example.com").first():
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            admin_user = User(
                name="Admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role_id=admin_role.id,
            )
            db.add(admin_user)
            db.commit()
            print("✅ Default admin created: admin@example.com / admin123")

        # Seed default normal user
        if not db.query(User).filter(User.email == "user@example.com").first():
            user_role = db.query(Role).filter(Role.name == "user").first()
            normal_user = User(
                name="User",
                email="user@example.com",
                hashed_password=get_password_hash("user123"),
                role_id=user_role.id,
            )
            db.add(normal_user)
            db.commit()
            print("✅ Default user created: user@example.com / user123")
    finally:
        db.close()
