from fastapi import APIRouter

from app.api.v1.endpoints.auth_router import router as auth_router
from app.api.v1.endpoints.users_router import router as users_router
from app.api.v1.endpoints.user_contacts_router import router as user_contacts_router
from app.api.v1.endpoints.organization_router import router as org_router
from app.api.v1.endpoints.tasks_router import router as tasks_router
from app.api.v1.endpoints.transfers_router import router as transfers_router
from app.api.v1.endpoints.shares_delegations_router import shares_router, delegations_router
from app.api.v1.endpoints.notifications_router import router as notif_router
from app.api.v1.endpoints.search_router import router as search_router
from app.api.v1.endpoints.JobLevels_router import router as JobLevels_router
from app.api.v1.endpoints.location_router import router as location_router
from app.api.v1.endpoints.Recurring_router import router as Recurring_router
from app.api.v1.endpoints.task_comments_router import router as task_comments_router
from app.api.v1.endpoints.task_assigns_router import router as task_assigns_router
from app.api.v1.endpoints.timeLog_router import router as timeLog_router
from app.api.v1.endpoints.task_attachments_router import router as task_attachments_router
from app.api.v1.endpoints.task_steps_router import router as task_steps_router
from app.api.v1.endpoints.user_stats_router import router as user_stats
from app.api.v1.endpoints.department_managers_router import router as department_managers

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(user_contacts_router)
api_router.include_router(user_stats)
api_router.include_router(org_router)
api_router.include_router(department_managers)
api_router.include_router(JobLevels_router)
api_router.include_router(location_router)
api_router.include_router(tasks_router)
api_router.include_router(task_assigns_router)
api_router.include_router(task_steps_router)
api_router.include_router(task_comments_router)
api_router.include_router(task_attachments_router)
api_router.include_router(timeLog_router)
api_router.include_router(Recurring_router)
api_router.include_router(transfers_router)
api_router.include_router(shares_router)
api_router.include_router(delegations_router)
api_router.include_router(notif_router)
api_router.include_router(search_router)
