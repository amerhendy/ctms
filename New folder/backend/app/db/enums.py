# db/enums.py
import enum


class GlobalRole(str, enum.Enum):
    GLOBAL_ADMIN = "global_admin"
    PROGRAM_MANAGER = "program_manager"
    USER = "user"


class TaskStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class WorkflowStatus(str, enum.Enum):
    PENDING     = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    CANCELLED   = "cancelled"
 
 
class StepStatus(str, enum.Enum):
    PENDING     = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    CANCELLED     = "cancelled"
    
class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class UrgencyStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AssignmentType(str, enum.Enum):
    ASSIGNEE = "assignee"        # منفذ
    COLLABORATOR = "collaborator" # متعاون
    VIEWER = "viewer"            # مشاهد


class TransferStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    TRANSFERRED_AGAIN = "transferred_again"


class SharePermission(str, enum.Enum):
    VIEW = "view"
    EDIT = "edit"
    MANAGE = "manage"
    ADMIN = "admin"


class RecurrencePattern(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class NotificationType(str, enum.Enum):
    TRANSFER_REQUEST = "transfer_request"
    TRANSFER_ACCEPTED = "transfer_accepted"
    TRANSFER_REJECTED = "transfer_rejected"
    URGENT_REQUEST = "urgent_request"
    URGENT_APPROVED = "urgent_approved"
    URGENT_REJECTED = "urgent_rejected"
    TASK_ASSIGNED = "task_assigned"
    TASK_UPDATED = "task_updated"
    STEP_COMPLETED = "step_completed"
    SHARE_GRANTED = "share_granted"
    DELEGATION_GRANTED = "delegation_granted"
    DELEGATION_REVOKED = "delegation_revoked"
    EXTERNAL_SHARE_REQUESTED = "external_share_requested"
    REMINDER = "reminder"
    NEW_COMMENT = "new_comment"
    NEW_ATTACHMENT = "new_attachment"
    WORKFLOW_COMPLETED = "workflow_completed"
    WORKFLOW_STEP_STARTED= "workflow_step_started"

class UserNotificationSettings(str, enum.Enum):
    UPDATE = "user changed their notification settings"
    CREATE = "user created new notification settings"
    DELETE = "user deleted their notification settings"
    
class userLogSettings(str,enum.Enum):
    CREATED="user_created"
    EDITED="user_edited"
    PWDCHANGE="password_change"

class TaskActionType(str, enum.Enum):
    CREATED = "created"
    EDITED = "edited"
    DELETED = "deleted"
    SOFT_DELETED = "soft_deleted"
    
    STATUS_CHANGED = "status_changed"
    PROGRESS_UPDATED = "progress_updated"
    
    STEP_ADDED = "step_added"
    STEP_UPDATED = "step_updated"
    STEP_COMPLETED = "step_completed"
    STEP_UNCOMPLETED = "step_uncompleted"
    STEP_DELETED = "step_deleted"
    STEPS_REORDERED = "steps_reordered"
    
    ASSIGNED = "assigned"
    UNASSIGNED = "unassigned"
    ASSIGN_RESTORED = "assign_restored"
    
    TRANSFER_REQUESTED = "transfer_requested"
    TRANSFER_ACCEPTED = "transfer_accepted"
    TRANSFER_REJECTED = "transfer_rejected"
    
    SHARE_GRANTED = "share_granted"
    SHARE_REVOKED = "share_revoked"
    SHARE_REQUESTED = "share_requested"
    SHARE_UPDATED = "share_updated"
    
    URGENCY_REQUESTED = "urgent_requested"
    URGENCY_APPROVED = "urgent_approved"
    URGENCY_REJECTED = "urgent_rejected"
    
    DELEGATED = "delegated"
    DELEGATION_REVOKED = "delegation_revoked"
    
    COMMENTED = "commented"
    COMMENT_ADDED = "comment_added"
    COMMENT_UPDATED = "comment_updated"
    COMMENT_DELETED = "comment_deleted"

    FILE_ATTACHED = "file_attached"
    ATTACHMENT_ADDED = "attachment_added"
    ATTACHMENT_DELETED = "attachment_deleted"
    ATTACHMENT_DOWNLOADED = "attachment_downloaded"
    
    REMINDER_SET = "reminder_set"
    FAVORITE_ADDED = "favorite_added"
    FAVORITE_REMOVED = "favorite_removed"

    RECURRING_TEMPLATE_CREATED = "recurring_template_created"
    RECURRING_TEMPLATE_EDITED = "recurring_template_edited"
    RECURRING_TEMPLATE_DELETED = "recurring_template_deleted"

    TIME_LOG_STARTED = "time_log_started"
    TIME_LOG_STOPPED = "time_log_stopped"