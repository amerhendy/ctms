"""تجميع كل النماذج في مكان واحد لضمان تسجيلها في Base.metadata قبل create_all."""

from models.admin import Admin
from models.applicant import Applicant
from models.job_model import JobModel
from models.question import Question
from models.response import Response
from models.session import Session
from models.violation import Violation

__all__ = [
    "Admin",
    "Applicant",
    "JobModel",
    "Question",
    "Response",
    "Session",
    "Violation",
]
