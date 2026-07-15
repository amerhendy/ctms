"""
Database Seeder – Creates initial data for development/testing
يُنشئ بيانات أولية للتطوير والاختبار
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal, init_db
from app.models import (
    JobLevel, Department, Location, User, GlobalRole
)
from app.core.security import get_password_hash


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        try:
            # ─── Job Levels ──────────────────────────────────────
            levels_data = [
                (1, "رئيس مجلس الإدارة"),
                (2, "رئيس قطاع"),
                (3, "مدير إدارة عامة"),
                (4, "مدير إدارة فرعية"),
                (5, "رئيس قسم"),
                (6, "رئيس محطة / منطقة"),
                (7, "موظف"),
            ]
            levels = {}
            for num, title in levels_data:
                level = JobLevel(level_number=num, title=title)
                db.add(level)
                await db.flush()
                levels[num] = level
            print("✅ Job levels created")

            # ─── Departments ─────────────────────────────────────
            # Root sectors
            sectors_data = [
                "المالي", "الموارد البشرية", "التجاري",
                "المعمل", "شمال سيناء", "جنوب", "الإدارات العامة", "الشئون القانونية"
            ]
            sectors = {}
            for name in sectors_data:
                dept = Department(name=name, job_level_id=levels[2].id, is_active=True)
                db.add(dept)
                await db.flush()
                sectors[name] = dept

            # Sub-departments under المالي
            mali_subs = ["شئون مالية", "مراجعة", "عقود"]
            mali_depts = {}
            for name in mali_subs:
                dept = Department(
                    name=name,
                    parent_department_id=sectors["المالي"].id,
                    job_level_id=levels[3].id,
                    is_active=True
                )
                db.add(dept)
                await db.flush()
                mali_depts[name] = dept

            # Sub-sub under عقود
            contracts_subs = ["مشتريات", "سكرتارية"]
            for name in contracts_subs:
                dept = Department(
                    name=name,
                    parent_department_id=mali_depts["عقود"].id,
                    job_level_id=levels[4].id,
                    is_active=True
                )
                db.add(dept)
                await db.flush()

            # Sub-departments under الموارد البشرية
            hr_subs = ["التوظيف", "التدريب", "شئون العاملين"]
            for name in hr_subs:
                dept = Department(
                    name=name,
                    parent_department_id=sectors["الموارد البشرية"].id,
                    job_level_id=levels[3].id,
                    is_active=True
                )
                db.add(dept)
                await db.flush()

            print("✅ Departments created")

            # ─── Locations ───────────────────────────────────────
            loc_main = Location(name="المقر الرئيسي", department_id=sectors["الإدارات العامة"].id, is_active=True)
            loc_north = Location(name="فرع شمال سيناء", department_id=sectors["شمال سيناء"].id, is_active=True)
            db.add(loc_main)
            db.add(loc_north)
            await db.flush()
            print("✅ Locations created")

            # ─── Users ───────────────────────────────────────────
            users_data = [
                {
                    "employee_number": "SYS001",
                    "full_name": "مدير النظام",
                    "job_title": "System Administrator",
                    "email": "admin@company.com",
                    "password": "Admin@123",
                    "global_role": GlobalRole.GLOBAL_ADMIN,
                    "job_level_id": levels[1].id,
                    "department_id": sectors["الإدارات العامة"].id,
                    "work_location_id": loc_main.id,
                },
                {
                    "employee_number": "PM001",
                    "full_name": "مدير البرنامج",
                    "job_title": "Program Manager",
                    "email": "pm@company.com",
                    "password": "Pm@12345",
                    "global_role": GlobalRole.PROGRAM_MANAGER,
                    "job_level_id": levels[1].id,
                    "department_id": sectors["الإدارات العامة"].id,
                    "work_location_id": loc_main.id,
                },
                {
                    "employee_number": "CEO001",
                    "full_name": "رئيس مجلس الإدارة",
                    "job_title": "Chairman",
                    "email": "ceo@company.com",
                    "password": "Ceo@12345",
                    "global_role": GlobalRole.USER,
                    "job_level_id": levels[1].id,
                    "department_id": sectors["الإدارات العامة"].id,
                    "work_location_id": loc_main.id,
                },
                {
                    "employee_number": "FIN001",
                    "full_name": "رئيس القطاع المالي",
                    "job_title": "Head of Finance Sector",
                    "email": "fin.head@company.com",
                    "password": "Fin@12345",
                    "global_role": GlobalRole.USER,
                    "job_level_id": levels[2].id,
                    "department_id": sectors["المالي"].id,
                    "work_location_id": loc_main.id,
                    "can_transfer_external": True,
                },
                {
                    "employee_number": "HR001",
                    "full_name": "رئيس قطاع الموارد البشرية",
                    "job_title": "Head of HR Sector",
                    "email": "hr.head@company.com",
                    "password": "Hr@123456",
                    "global_role": GlobalRole.USER,
                    "job_level_id": levels[2].id,
                    "department_id": sectors["الموارد البشرية"].id,
                    "work_location_id": loc_main.id,
                    "can_transfer_external": True,
                },
                {
                    "employee_number": "FIN002",
                    "full_name": "مدير الشئون المالية",
                    "job_title": "Financial Affairs Manager",
                    "email": "fin.mgr@company.com",
                    "password": "Fin@12345",
                    "global_role": GlobalRole.USER,
                    "job_level_id": levels[3].id,
                    "department_id": mali_depts["شئون مالية"].id,
                    "work_location_id": loc_main.id,
                },
                {
                    "employee_number": "EMP001",
                    "full_name": "أحمد محمد - موظف مالي",
                    "job_title": "Financial Specialist",
                    "email": "ahmed@company.com",
                    "password": "Ahmed@123",
                    "global_role": GlobalRole.USER,
                    "job_level_id": levels[7].id,
                    "department_id": mali_depts["شئون مالية"].id,
                    "work_location_id": loc_main.id,
                },
                {
                    "employee_number": "EMP002",
                    "full_name": "سارة أحمد - موظفة HR",
                    "job_title": "HR Specialist",
                    "email": "sara@company.com",
                    "password": "Sara@1234",
                    "global_role": GlobalRole.USER,
                    "job_level_id": levels[7].id,
                    "department_id": sectors["الموارد البشرية"].id,
                    "work_location_id": loc_main.id,
                },
            ]

            created_users = {}
            for u_data in users_data:
                password = u_data.pop("password")
                user = User(
                    **u_data,
                    password_hash=get_password_hash(password),
                    is_active=True,
                )
                db.add(user)
                await db.flush()
                created_users[u_data["employee_number"]] = user

            # Set manager relationships
            fin_head = created_users["FIN001"]
            fin_mgr = created_users["FIN002"]
            emp_ahmed = created_users["EMP001"]

            fin_mgr.manager_id = fin_head.id
            emp_ahmed.manager_id = fin_mgr.id
            created_users["EMP002"].manager_id = created_users["HR001"].id

            await db.flush()
            print("✅ Users created")

            await db.commit()
            print("\n🎉 Seeding completed successfully!")
            print("\n📋 Login credentials:")
            print("  admin@company.com      / Admin@123   (System Admin)")
            print("  pm@company.com         / Pm@12345    (Program Manager)")
            print("  ceo@company.com        / Ceo@12345   (CEO)")
            print("  fin.head@company.com   / Fin@12345   (Finance Head - Level 2)")
            print("  hr.head@company.com    / Hr@123456   (HR Head - Level 2)")
            print("  fin.mgr@company.com    / Fin@12345   (Finance Manager - Level 3)")
            print("  ahmed@company.com      / Ahmed@123   (Employee)")
            print("  sara@company.com       / Sara@1234   (Employee)")

        except Exception as e:
            await db.rollback()
            print(f"❌ Seeding failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())
