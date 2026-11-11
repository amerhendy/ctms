--
-- PostgreSQL database dump
--

\restrict EnH5nKBOv9hRfI2Sb2wGXf1hilXcOSGhyxPOBpvW7kJXfnB1E9U0oIu0CLAgp1b

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgstattuple; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgstattuple WITH SCHEMA public;


--
-- Name: EXTENSION pgstattuple; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgstattuple IS 'show tuple-level statistics';


--
-- Name: assignmenttype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.assignmenttype AS ENUM (
    'ASSIGNEE',
    'COLLABORATOR',
    'VIEWER'
);


ALTER TYPE public.assignmenttype OWNER TO postgres;

--
-- Name: globalrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.globalrole AS ENUM (
    'GLOBAL_ADMIN',
    'PROGRAM_MANAGER',
    'USER'
);


ALTER TYPE public.globalrole OWNER TO postgres;

--
-- Name: recurrencepattern; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.recurrencepattern AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'YEARLY'
);


ALTER TYPE public.recurrencepattern OWNER TO postgres;

--
-- Name: sharepermission; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sharepermission AS ENUM (
    'VIEW',
    'EDIT',
    'MANAGE',
    'ADMIN'
);


ALTER TYPE public.sharepermission OWNER TO postgres;

--
-- Name: step_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.step_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.step_status OWNER TO postgres;

--
-- Name: taskpriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskpriority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public.taskpriority OWNER TO postgres;

--
-- Name: taskstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskstatus AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.taskstatus OWNER TO postgres;

--
-- Name: transferstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transferstatus AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'TRANSFERRED_AGAIN'
);


ALTER TYPE public.transferstatus OWNER TO postgres;

--
-- Name: urgencystatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.urgencystatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.urgencystatus OWNER TO postgres;

--
-- Name: workflow_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.workflow_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.workflow_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: delegations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delegations (
    id integer NOT NULL,
    delegator_id integer NOT NULL,
    delegate_id integer NOT NULL,
    permission_types character varying(255) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    is_active boolean NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.delegations OWNER TO postgres;

--
-- Name: delegations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delegations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delegations_id_seq OWNER TO postgres;

--
-- Name: delegations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delegations_id_seq OWNED BY public.delegations.id;


--
-- Name: department_managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_managers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department_id integer NOT NULL,
    is_primary boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.department_managers OWNER TO postgres;

--
-- Name: department_managers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_managers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_managers_id_seq OWNER TO postgres;

--
-- Name: department_managers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_managers_id_seq OWNED BY public.department_managers.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    parent_department_id integer,
    location_id integer,
    job_level_id integer,
    is_active boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorites_id_seq OWNER TO postgres;

--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: job_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_levels (
    id integer NOT NULL,
    level_number integer NOT NULL,
    title character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.job_levels OWNER TO postgres;

--
-- Name: job_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_levels_id_seq OWNER TO postgres;

--
-- Name: job_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_levels_id_seq OWNED BY public.job_levels.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean NOT NULL
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_settings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    browser boolean NOT NULL,
    email boolean NOT NULL,
    whatsapp boolean NOT NULL,
    telegram boolean NOT NULL,
    sms boolean NOT NULL,
    google boolean NOT NULL
);


ALTER TABLE public.notification_settings OWNER TO postgres;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_settings_id_seq OWNER TO postgres;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_settings_id_seq OWNED BY public.notification_settings.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    related_task_id integer,
    extra_data text,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: recurring_task_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_task_logs (
    id integer NOT NULL,
    recurring_task_id integer NOT NULL,
    status character varying(20) NOT NULL,
    generated_task_id integer,
    error_message text,
    run_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recurring_task_logs OWNER TO postgres;

--
-- Name: recurring_task_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recurring_task_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recurring_task_logs_id_seq OWNER TO postgres;

--
-- Name: recurring_task_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recurring_task_logs_id_seq OWNED BY public.recurring_task_logs.id;


--
-- Name: recurring_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    department_id integer NOT NULL,
    created_by integer NOT NULL,
    priority public.taskpriority NOT NULL,
    recurrence_pattern public.recurrencepattern NOT NULL,
    interval_value integer NOT NULL,
    day_of_week integer,
    day_of_month integer,
    next_run_date date NOT NULL,
    is_active boolean NOT NULL,
    run_time time without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.recurring_tasks OWNER TO postgres;

--
-- Name: recurring_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recurring_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recurring_tasks_id_seq OWNER TO postgres;

--
-- Name: recurring_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recurring_tasks_id_seq OWNED BY public.recurring_tasks.id;


--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_assignments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    assignment_type public.assignmenttype NOT NULL,
    assigned_by integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.task_assignments OWNER TO postgres;

--
-- Name: task_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_assignments_id_seq OWNER TO postgres;

--
-- Name: task_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_assignments_id_seq OWNED BY public.task_assignments.id;


--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_attachments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_attachments OWNER TO postgres;

--
-- Name: task_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_attachments_id_seq OWNER TO postgres;

--
-- Name: task_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_attachments_id_seq OWNED BY public.task_attachments.id;


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_comments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_comments OWNER TO postgres;

--
-- Name: task_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_comments_id_seq OWNER TO postgres;

--
-- Name: task_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_comments_id_seq OWNED BY public.task_comments.id;


--
-- Name: task_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_logs (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer,
    action_type character varying(50) NOT NULL,
    old_value text,
    new_value text,
    extra_data text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    recurring_task_id integer
);


ALTER TABLE public.task_logs OWNER TO postgres;

--
-- Name: task_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_logs_id_seq OWNER TO postgres;

--
-- Name: task_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_logs_id_seq OWNED BY public.task_logs.id;


--
-- Name: task_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_shares (
    id integer NOT NULL,
    task_id integer NOT NULL,
    shared_with_user_id integer NOT NULL,
    permission public.sharepermission NOT NULL,
    shared_by integer NOT NULL,
    requires_approval boolean NOT NULL,
    approval_status character varying(20),
    approved_by integer,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_shares OWNER TO postgres;

--
-- Name: task_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_shares_id_seq OWNER TO postgres;

--
-- Name: task_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_shares_id_seq OWNED BY public.task_shares.id;


--
-- Name: task_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_steps (
    id integer NOT NULL,
    task_id integer NOT NULL,
    title text NOT NULL,
    description text,
    step_order integer NOT NULL,
    is_parallel boolean NOT NULL,
    status public.step_status DEFAULT 'pending'::public.step_status NOT NULL,
    assigned_department_id integer,
    assigned_user_id integer,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    completed_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.task_steps OWNER TO postgres;

--
-- Name: task_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_steps_id_seq OWNER TO postgres;

--
-- Name: task_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_steps_id_seq OWNED BY public.task_steps.id;


--
-- Name: task_time_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_time_logs (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    started_at timestamp without time zone NOT NULL,
    stopped_at timestamp without time zone,
    note text,
    duration_minutes integer GENERATED ALWAYS AS ((EXTRACT(epoch FROM (stopped_at - started_at)) / (60)::numeric)) STORED
);


ALTER TABLE public.task_time_logs OWNER TO postgres;

--
-- Name: task_time_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_time_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_time_logs_id_seq OWNER TO postgres;

--
-- Name: task_time_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_time_logs_id_seq OWNED BY public.task_time_logs.id;


--
-- Name: task_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_transfers (
    id integer NOT NULL,
    task_id integer NOT NULL,
    from_department_id integer NOT NULL,
    to_department_id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    status public.transferstatus NOT NULL,
    rejection_reason text,
    transfer_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone
);


ALTER TABLE public.task_transfers OWNER TO postgres;

--
-- Name: task_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_transfers_id_seq OWNER TO postgres;

--
-- Name: task_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_transfers_id_seq OWNED BY public.task_transfers.id;


--
-- Name: task_workflow_step_dependencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_workflow_step_dependencies (
    id integer NOT NULL,
    parent_step_id integer NOT NULL,
    child_step_id integer NOT NULL
);


ALTER TABLE public.task_workflow_step_dependencies OWNER TO postgres;

--
-- Name: task_workflow_step_dependencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_workflow_step_dependencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_workflow_step_dependencies_id_seq OWNER TO postgres;

--
-- Name: task_workflow_step_dependencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_workflow_step_dependencies_id_seq OWNED BY public.task_workflow_step_dependencies.id;


--
-- Name: task_workflow_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_workflow_steps (
    id integer NOT NULL,
    workflow_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    step_order integer NOT NULL,
    is_parallel boolean NOT NULL,
    assigned_department_id integer,
    assigned_user_id integer,
    status public.step_status NOT NULL,
    notes text,
    completed_by integer,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    version integer,
    deleted_at timestamp without time zone
);


ALTER TABLE public.task_workflow_steps OWNER TO postgres;

--
-- Name: task_workflow_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_workflow_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_workflow_steps_id_seq OWNER TO postgres;

--
-- Name: task_workflow_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_workflow_steps_id_seq OWNED BY public.task_workflow_steps.id;


--
-- Name: task_workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_workflows (
    id integer NOT NULL,
    task_id integer NOT NULL,
    template_id integer,
    status public.workflow_status NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.task_workflows OWNER TO postgres;

--
-- Name: task_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_workflows_id_seq OWNER TO postgres;

--
-- Name: task_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_workflows_id_seq OWNED BY public.task_workflows.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_number character varying(100),
    start_date timestamp without time zone,
    due_date timestamp without time zone,
    reminder_datetime timestamp without time zone,
    completed_at timestamp without time zone,
    is_urgent boolean NOT NULL,
    is_important boolean NOT NULL,
    priority public.taskpriority NOT NULL,
    progress_percentage integer NOT NULL,
    status public.taskstatus NOT NULL,
    created_by integer NOT NULL,
    department_id integer NOT NULL,
    urgency_requested_at timestamp without time zone,
    urgency_requested_by integer,
    urgency_request_status public.urgencystatus,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_contacts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    phone_number character varying(20),
    whatsapp_number character varying(20),
    telegram_username character varying(50),
    extension_number character varying(10),
    is_private boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_contacts OWNER TO postgres;

--
-- Name: user_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_contacts_id_seq OWNER TO postgres;

--
-- Name: user_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_contacts_id_seq OWNED BY public.user_contacts.id;


--
-- Name: user_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action character varying NOT NULL,
    old_data json,
    new_data json,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.user_logs OWNER TO postgres;

--
-- Name: user_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_logs_id_seq OWNER TO postgres;

--
-- Name: user_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_logs_id_seq OWNED BY public.user_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    employee_number character varying(50) NOT NULL,
    full_name character varying(255) NOT NULL,
    job_title character varying(255) NOT NULL,
    work_location_id integer,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    google_id character varying(255),
    job_level_id integer,
    department_id integer,
    global_role public.globalrole NOT NULL,
    can_transfer_external boolean NOT NULL,
    is_active boolean NOT NULL,
    avatar_url character varying(500),
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workflow_template_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_template_steps (
    id integer NOT NULL,
    template_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    step_order integer NOT NULL,
    is_parallel boolean,
    assigned_department_id integer,
    assigned_user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.workflow_template_steps OWNER TO postgres;

--
-- Name: workflow_template_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_template_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_template_steps_id_seq OWNER TO postgres;

--
-- Name: workflow_template_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_template_steps_id_seq OWNED BY public.workflow_template_steps.id;


--
-- Name: workflow_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.workflow_templates OWNER TO postgres;

--
-- Name: workflow_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_templates_id_seq OWNER TO postgres;

--
-- Name: workflow_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_templates_id_seq OWNED BY public.workflow_templates.id;


--
-- Name: delegations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations ALTER COLUMN id SET DEFAULT nextval('public.delegations_id_seq'::regclass);


--
-- Name: department_managers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_managers ALTER COLUMN id SET DEFAULT nextval('public.department_managers_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: job_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_levels ALTER COLUMN id SET DEFAULT nextval('public.job_levels_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: recurring_task_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_task_logs ALTER COLUMN id SET DEFAULT nextval('public.recurring_task_logs_id_seq'::regclass);


--
-- Name: recurring_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks ALTER COLUMN id SET DEFAULT nextval('public.recurring_tasks_id_seq'::regclass);


--
-- Name: task_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments ALTER COLUMN id SET DEFAULT nextval('public.task_assignments_id_seq'::regclass);


--
-- Name: task_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments ALTER COLUMN id SET DEFAULT nextval('public.task_attachments_id_seq'::regclass);


--
-- Name: task_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments ALTER COLUMN id SET DEFAULT nextval('public.task_comments_id_seq'::regclass);


--
-- Name: task_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs ALTER COLUMN id SET DEFAULT nextval('public.task_logs_id_seq'::regclass);


--
-- Name: task_shares id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares ALTER COLUMN id SET DEFAULT nextval('public.task_shares_id_seq'::regclass);


--
-- Name: task_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps ALTER COLUMN id SET DEFAULT nextval('public.task_steps_id_seq'::regclass);


--
-- Name: task_time_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_time_logs ALTER COLUMN id SET DEFAULT nextval('public.task_time_logs_id_seq'::regclass);


--
-- Name: task_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers ALTER COLUMN id SET DEFAULT nextval('public.task_transfers_id_seq'::regclass);


--
-- Name: task_workflow_step_dependencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_step_dependencies ALTER COLUMN id SET DEFAULT nextval('public.task_workflow_step_dependencies_id_seq'::regclass);


--
-- Name: task_workflow_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_steps ALTER COLUMN id SET DEFAULT nextval('public.task_workflow_steps_id_seq'::regclass);


--
-- Name: task_workflows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflows ALTER COLUMN id SET DEFAULT nextval('public.task_workflows_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_contacts ALTER COLUMN id SET DEFAULT nextval('public.user_contacts_id_seq'::regclass);


--
-- Name: user_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_logs ALTER COLUMN id SET DEFAULT nextval('public.user_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workflow_template_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_template_steps ALTER COLUMN id SET DEFAULT nextval('public.workflow_template_steps_id_seq'::regclass);


--
-- Name: workflow_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_templates ALTER COLUMN id SET DEFAULT nextval('public.workflow_templates_id_seq'::regclass);


--
-- Data for Name: delegations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delegations (id, delegator_id, delegate_id, permission_types, start_date, end_date, is_active, notes, created_at) FROM stdin;
\.


--
-- Data for Name: department_managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_managers (id, user_id, department_id, is_primary, created_at, updated_at, deleted_at) FROM stdin;
1	1060	105	t	2026-06-16 20:56:58.528199	2026-06-16 20:56:58.528199	\N
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, parent_department_id, location_id, job_level_id, is_active, created_at) FROM stdin;
104	مجلس ادارة الشركة	\N	13	14	t	2026-06-08 01:22:06.256536
108	قطاع تنمية الموارد البشرية والتدريب	104	\N	19	t	2026-06-08 01:23:43.647043
109	قطاع المشروعات	104	\N	19	t	2026-06-08 01:24:03.946886
110	الادارة العامة للعلاقات العامة والاعلام والتوعية والخط الساخن	104	\N	20	t	2026-06-08 01:24:41.697817
112	قطاع الشئون التجارية	104	\N	19	t	2026-06-08 01:26:50.05191
113	قطاع الشئون المالية والادارية	104	\N	19	t	2026-06-08 01:27:03.396309
114	قطاع الدعم الفنى	104	\N	19	t	2026-06-08 01:27:16.652739
115	قطاع المعامل والجودة	104	\N	19	t	2026-06-08 01:27:30.628115
133	ادارة العلاقات العامة	110	\N	22	t	2026-06-08 01:33:23.58847
111	الادار ة العامة للأمن	104	13	20	t	2026-06-08 01:25:00.667894
118	ادارة الحراسات	111	13	22	t	2026-06-08 01:28:24.461566
119	ادارة الديوان	111	13	22	t	2026-06-08 01:28:35.992179
121	ادارة جنوب	111	14	22	t	2026-06-08 01:28:55.990736
120	ادارة شمال	111	15	22	t	2026-06-08 01:28:45.514406
117	الادارة العامة لتكنولوجيا المعلومات	104	13	20	t	2026-06-08 01:28:04.620127
123	ادارة البرمجيات	117	13	22	t	2026-06-08 01:29:18.826421
122	ادارة الشبكات	117	13	22	t	2026-06-08 01:29:07.727552
124	ادارة الصيانة	117	13	22	t	2026-06-08 01:29:31.149768
105	الادارة العامة لشئون مجلس الادارة	104	13	20	t	2026-06-08 01:22:27.995864
128	ادارة الاستثمار	105	13	22	t	2026-06-08 01:30:21.37138
126	ادارة السكرتارية	105	13	22	t	2026-06-08 01:29:58.696194
127	ادارة المتابعة	105	13	22	t	2026-06-08 01:30:10.924848
125	ادارة شئون مجلس الادارة	105	13	22	t	2026-06-08 01:29:45.844422
116	الادارة العامة للتفتيش والرقابة الداخلية	104	13	20	t	2026-06-08 01:27:50.293772
107	الادارة العامة للشئون القانونية	104	13	20	t	2026-06-08 01:23:19.067895
131	ادارة التحقيقات	107	13	22	t	2026-06-08 01:30:57.793209
130	ادارة القضايا	107	13	22	t	2026-06-08 01:30:48.402457
132	ادارة المكتب الفنى	107	13	22	t	2026-06-08 01:31:07.981705
129	قسم السكرتارية	107	13	25	t	2026-06-08 01:30:37.423516
134	شئون قانونية شمال	107	15	22	t	2026-06-09 19:52:26.006551
135	شئون قانونية جنوب	107	13	\N	t	2026-06-09 19:52:48.10362
137	الادارة العامة للتخطيط	106	13	20	t	2026-06-14 22:21:30.188693
138	الادارة العامة للتحليل الهيدروليكى	106	18	20	t	2026-06-14 22:21:51.909493
136	هيئة	104	10	25	f	2026-06-10 20:39:51.693341
106	قطاع التخطيط	104	\N	19	t	2026-06-08 01:22:51.918218
143	موووو	\N	6	16	f	2026-06-16 00:30:28.193181
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, task_id, created_at) FROM stdin;
2	1060	1018	2026-06-23 21:27:29.072891
\.


--
-- Data for Name: job_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_levels (id, level_number, title, description) FROM stdin;
14	1	رئيس مجلس الادارة	
16	1	مدير النظام	
17	1	المبرمج	
18	2	نائب رئيس مجلس الادارة	
19	2	رئيس قطاع	
25	5	رئيس قسم	
26	3	مدير عام منطقة	
20	2	مدير عام 	
22	3	مدير 	
27	3	مدير منطقة 	
29	8	موظف	لجعل زر الحذف متوافقاً تماماً مع الوضع الليلي (Dark Mode) 
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, name, is_active) FROM stdin;
17	دهب	t
18	نويبع	t
10	سانت كاترين	t
11	شرم الشيخ	t
19	stringaaaa	f
20	stringaaaasssssssss	f
15	شمال سيناء	t
14	جنوب سيناء	t
16	بئر العبد	t
1	العريش	t
2	الشيخ زويد	t
6	رفح	t
3	نخل	t
5	تاحسنة	t
7	ابورديس	t
4	رأس سدر	t
8	ابوزنيمة	t
9	طور سيناء	t
12	طابا	t
13	الديوان العام	t
\.


--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_settings (id, user_id, browser, email, whatsapp, telegram, sms, google) FROM stdin;
1	1	t	t	t	t	t	t
2	1060	t	t	t	t	t	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, body, related_task_id, extra_data, read_at, created_at, deleted_at) FROM stdin;
1	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1	{"automation": true, "template_id": 154}	\N	2026-07-02 11:57:31.807727	\N
2	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1	{"automation": true, "template_id": 154}	\N	2026-07-02 11:57:31.807727	\N
82	1060	created	تم اضافة مهمة جديدة (${task_data.title})	تم اضافتك لمهمة بواسطة $System Developer	1010	\N	\N	2026-06-21 18:02:51.948373	\N
83	1060	new_comment	تعليق جديد على المهمة	قام الموظف System Developer بإضافة تعليق جديد على مهمة تشترك بها "مهمة9"	1018	\N	\N	2026-06-24 20:50:53.281162	\N
86	1067	transfer_request	طلب تحويل مهمة	تم إرسال مهمة "مهمة9a" من مجلس ادارة الشركة إليك في الادارة العامة لشئون مجلس الادارة	1018	{"from_user_id": 1}	\N	2026-06-24 23:32:53.102343	\N
217	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (sdf). يرجى المتابعة والبدء في التنفيذ.	1025	{"automation": true, "template_id": 154}	\N	2026-06-28 22:49:20.481608	\N
218	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (sdf). يرجى المتابعة والبدء في التنفيذ.	1025	{"automation": true, "template_id": 154}	2026-06-28 22:49:28.183327	2026-06-28 22:49:20.481608	\N
219	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (sdf). يرجى المتابعة والبدء في التنفيذ.	1026	{"automation": true, "template_id": 154}	\N	2026-06-29 18:01:01.648389	\N
220	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (sdf). يرجى المتابعة والبدء في التنفيذ.	1026	{"automation": true, "template_id": 154}	2026-06-29 19:41:18.598701	2026-06-29 18:01:01.648389	\N
221	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1027	{"automation": true, "template_id": 154}	\N	2026-06-30 15:33:48.370774	\N
222	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1027	{"automation": true, "template_id": 154}	\N	2026-06-30 15:33:48.370774	\N
223	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1028	{"automation": true, "template_id": 154}	\N	2026-06-30 16:53:07.674318	\N
224	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1028	{"automation": true, "template_id": 154}	\N	2026-06-30 16:53:07.674318	\N
225	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1029	{"automation": true, "template_id": 154}	\N	2026-06-30 21:29:49.098656	\N
226	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	1029	{"automation": true, "template_id": 154}	\N	2026-06-30 21:29:49.098656	\N
130	1071	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'sdf' في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 18:44:44.774251	\N
131	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 18:56:04.003158	\N
132	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 18:56:12.140485	\N
133	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:07:05.495267	\N
134	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:07:07.32092	\N
135	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:07:11.674825	\N
137	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:08:01.977236	\N
139	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:09:19.085729	\N
140	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:09:26.61444	\N
142	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:11:02.888056	\N
143	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:11:20.062996	\N
145	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:11:45.987723	\N
146	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:12:10.992391	\N
148	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:12:47.238587	\N
149	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:13:06.127973	\N
151	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:15:02.105056	\N
152	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:18:00.197524	\N
153	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:18:03.005121	\N
154	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:18:07.886362	\N
155	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:18:15.662204	\N
136	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:07:15.301995	\N
138	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:09:08.808043	\N
141	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:09:36.874743	\N
144	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:11:39.277367	\N
147	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:12:19.686516	\N
150	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة4'	1013	\N	\N	2026-06-28 19:13:53.116712	\N
197	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:09:55.010672	\N
198	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:11:05.221008	\N
91	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'step 1' في المهمة 'مهمة2'	1011	\N	2026-06-28 22:42:16.81958	2026-06-28 13:38:39.105312	\N
92	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة2'	1011	\N	2026-06-28 22:42:16.81958	2026-06-28 13:39:16.759826	\N
93	1	step_status_changed	تغير حالة خطوة	أصبحت حالة الخطوة 'strinرg' في المهمة 'مهمة2' هي: pending	1011	\N	2026-06-28 22:42:16.81958	2026-06-28 13:39:38.497148	\N
94	1	step_status_changed	تغير حالة خطوة	أصبحت حالة الخطوة 'strinرg' في المهمة 'مهمة2' هي: pending	1011	\N	2026-06-28 22:42:16.81958	2026-06-28 13:39:42.782887	\N
95	1	step_status_changed	تغير حالة خطوة	أصبحت حالة الخطوة 'strinرg' في المهمة 'مهمة2' هي: in_progress	1011	\N	2026-06-28 22:42:16.81958	2026-06-28 13:39:48.202406	\N
96	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة2'	1011	\N	2026-06-28 22:42:16.81958	2026-06-28 13:40:05.991526	\N
97	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'dsfsdfsdfsd' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:40:34.414023	\N
98	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'dsfsdfsdfsd' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:40:55.247336	\N
99	1	step_deleted	تم حذف خطوة	تم حذف الخطوة 'dsfsdfsdfsd' من المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:41:04.667208	\N
100	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'dsfsdfsdfsd' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:41:12.899732	\N
101	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'aaaaaaa' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:45:00.445564	\N
102	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'aaaaaaa' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:50:38.266636	\N
103	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:51:16.462629	\N
104	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'aaaaaaasssss' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:52:09.320712	\N
105	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'aaaaaaasssss' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:52:27.441101	\N
106	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'aaaaaaasssss' في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 14:53:50.312111	\N
107	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:00.789589	\N
108	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:04.200279	\N
109	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:05.509809	\N
110	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:06.137103	\N
111	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:06.700507	\N
112	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:07.256131	\N
113	1	step_reordered	تم تغيير ترتيب الخطوات	قام System Developer بتغيير ترتيب الخطوات في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 15:00:07.77144	\N
114	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:24:09.299663	\N
115	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:24:29.369765	\N
116	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:24:41.528956	\N
117	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:32:34.175626	\N
118	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:33:52.902375	\N
119	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:33:56.147476	\N
120	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:33:57.528238	\N
121	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:34:05.73402	\N
122	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:34:17.194983	\N
123	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:34:57.522243	\N
124	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:35:04.990733	\N
125	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:35:35.719518	\N
126	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:35:41.43956	\N
127	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:36:54.258722	\N
128	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:37:12.412716	\N
129	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 16:37:14.456005	\N
156	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:27:44.061955	\N
157	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:27:55.095021	\N
158	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:31:00.188433	\N
159	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:31:00.18902	\N
160	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:31:06.902941	\N
161	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:31:06.915149	\N
162	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:32:38.589797	\N
163	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:42:14.404646	\N
164	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:43:09.500472	\N
165	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:43:38.408077	\N
166	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:45:07.453855	\N
167	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:45:17.565394	\N
168	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:45:19.615	\N
169	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:45:34.486753	\N
170	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:45:34.49073	\N
171	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:46:32.83167	\N
172	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:46:32.837094	\N
173	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:47:11.882175	\N
174	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:47:21.419313	\N
175	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:47:29.987004	\N
176	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:49:05.701093	\N
177	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:52:51.14164	\N
178	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:53:49.14193	\N
179	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:53:52.288436	\N
180	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:53:52.411558	\N
181	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:55:22.144719	\N
182	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:55:55.124459	\N
183	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:57:07.457795	\N
184	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:57:10.900387	\N
185	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:58:45.187996	\N
186	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:58:55.808252	\N
187	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 20:59:37.095312	\N
188	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:00:26.220866	\N
189	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:00:44.816117	\N
190	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:02:05.648137	\N
191	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:02:33.98322	\N
192	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:03:12.775876	\N
193	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:03:21.024573	\N
194	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:04:36.573636	\N
195	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:05:05.50338	\N
196	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:09:39.86838	\N
199	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:13:22.363733	\N
200	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:14:08.701676	\N
201	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:14:47.352435	\N
202	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:15:35.27519	\N
203	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:16:36.373178	\N
204	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:17:04.717638	\N
205	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:17:15.974527	\N
206	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:17:49.656365	\N
207	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:19:29.17345	\N
208	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:19:43.38599	\N
209	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:40:02.062976	\N
210	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:40:02.079142	\N
211	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:40:18.10724	\N
212	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:40:35.280014	\N
213	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:40:38.791605	\N
214	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:43:57.873623	\N
215	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:43:57.873109	\N
216	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'مهمة9a'	1018	\N	2026-06-28 22:42:16.81958	2026-06-28 21:48:20.930605	\N
\.


--
-- Data for Name: recurring_task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_task_logs (id, recurring_task_id, status, generated_task_id, error_message, run_at) FROM stdin;
1141	154	success	1025	\N	2026-06-28 22:49:20.605405
1142	154	success	1026	\N	2026-06-29 18:01:01.164224
1143	154	success	1027	\N	2026-06-30 15:33:35.70039
1144	154	success	1028	\N	2026-06-30 16:53:06.873358
1145	154	success	1029	\N	2026-06-30 21:29:48.433444
1	154	success	1	\N	2026-07-02 11:57:31.226381
\.


--
-- Data for Name: recurring_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_tasks (id, title, description, department_id, created_by, priority, recurrence_pattern, interval_value, day_of_week, day_of_month, next_run_date, is_active, run_time, created_at, updated_at, deleted_at) FROM stdin;
154	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	104	1	MEDIUM	DAILY	1	\N	\N	2026-06-16	t	08:00:00	2026-06-28 22:40:16.678744	2026-07-02 11:57:31.226381	\N
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_assignments (id, task_id, user_id, assignment_type, assigned_by, assigned_at, deleted_at) FROM stdin;
4	1010	1062	ASSIGNEE	1	2026-06-24 00:30:07.761524	\N
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_attachments (id, task_id, user_id, file_name, file_path, file_size, mime_type, created_at) FROM stdin;
\.


--
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_comments (id, task_id, user_id, comment_text, created_at, updated_at) FROM stdin;
4	1010	1	asasas	2026-06-23 23:54:16.561808	2026-06-23 23:54:16.561808
7	1018	1	ds	2026-06-24 17:50:53.281162	2026-06-24 17:50:53.281162
\.


--
-- Data for Name: task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_logs (id, task_id, user_id, action_type, old_value, new_value, extra_data, "timestamp", recurring_task_id) FROM stdin;
\.


--
-- Data for Name: task_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_shares (id, task_id, shared_with_user_id, permission, shared_by, requires_approval, approval_status, approved_by, expires_at, created_at) FROM stdin;
3	1010	1067	VIEW	1	f	approved	\N	\N	2026-06-24 20:34:44.885615
6	1018	1067	VIEW	1	f	approved	\N	\N	2026-06-24 20:56:44.931838
\.


--
-- Data for Name: task_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_steps (id, task_id, title, description, step_order, is_parallel, status, assigned_department_id, assigned_user_id, started_at, completed_at, completed_by, created_at, updated_at) FROM stdin;
7	1018	aaaaaaasssss	sdf	0	f	pending	\N	1	\N	\N	\N	2026-06-28 14:52:09.264074	2026-06-28 21:13:22.220737
8	1018	aaaaaaasssss	sdf	0	f	pending	\N	1	\N	\N	\N	2026-06-28 14:52:27.382533	2026-06-28 21:14:08.532781
5	1018	aaaaaaa	sdf	1	f	in_progress	104	\N	2026-06-28 16:00:34.346	\N	\N	2026-06-28 14:45:00.294494	2026-06-28 21:15:34.9868
2	1018	dsfsdfsdfsd	sdfsdsd	3	f	completed	104	\N	\N	\N	\N	2026-06-28 14:40:33.88163	2026-06-28 21:43:57.758641
9	1018	aaaaaaasssss	sdf	5	f	pending	\N	1	\N	\N	\N	2026-06-28 14:53:50.167323	2026-06-28 21:48:20.774512
12	1016	شسس	شسشسش	5	t	pending	114	\N	\N	\N	\N	2026-06-29 23:05:24.863568	2026-06-29 23:05:24.863568
6	1016	aaaaaaa	sdf	2	f	in_progress	\N	1	\N	\N	\N	2026-06-28 14:50:38.047557	2026-06-28 21:19:29.017954
10	1021	sdf	sdf	1	t	pending	104	\N	\N	\N	\N	2026-06-28 18:44:44.440095	2026-06-28 19:18:15.634783
14	1010	test	test	2	f	in_progress	104	\N	\N	\N	\N	2026-06-29 23:55:08.724349	2026-06-29 23:55:36.977726
11	1010	These utilities only support the browser keywords auto, thin, and none.	بلي	1	t	pending	\N	1	2026-06-29 22:56:45.817	\N	\N	2026-06-29 20:56:42.82466	2026-06-29 23:55:36.977726
\.


--
-- Data for Name: task_time_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_time_logs (id, task_id, user_id, started_at, stopped_at, note) FROM stdin;
9	1018	1	2026-06-24 20:10:21.251489	2026-06-24 20:10:36.772901	\N
10	1018	1	2026-06-28 08:38:05.138472	2026-06-28 08:38:07.321274	\N
\.


--
-- Data for Name: task_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_transfers (id, task_id, from_department_id, to_department_id, from_user_id, to_user_id, status, rejection_reason, transfer_note, created_at, resolved_at) FROM stdin;
2	1016	107	104	1067	1	PENDING	\N	\N	2026-06-23 19:50:21.318385	\N
3	1018	104	105	1	1067	PENDING	\N	\N	2026-06-24 20:32:53.102343	\N
\.


--
-- Data for Name: task_workflow_step_dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_workflow_step_dependencies (id, parent_step_id, child_step_id) FROM stdin;
5	45	46
9	45	46
\.


--
-- Data for Name: task_workflow_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_workflow_steps (id, workflow_id, title, description, step_order, is_parallel, assigned_department_id, assigned_user_id, status, notes, completed_by, started_at, completed_at, created_at, updated_at, version, deleted_at) FROM stdin;
45	46	الخطورة رقم 1	desc	1	f	104	\N	in_progress	test notes	1	\N	2026-07-02 12:38:11.337493	2026-07-02 15:31:09.083114	2026-07-04 15:08:57.752234	1	2026-07-04 15:08:57.997428
46	46	الخطورة رقم 2	desc	2	t	\N	1060	in_progress	\N	\N	\N	\N	2026-07-02 15:31:09.083114	2026-07-04 15:08:57.752234	1	2026-07-04 15:08:57.997545
47	53	خطوة 1	\N	1	f	104	\N	pending	\N	\N	\N	\N	2026-07-03 21:49:19.236955	2026-07-03 21:49:19.236955	1	\N
48	53	خطوة 2	\N	1	t	110	\N	pending	\N	\N	\N	\N	2026-07-03 21:53:38.023062	2026-07-03 21:53:38.023062	1	\N
50	53	خطوة 4	\N	2	f	104	\N	pending	\N	\N	\N	\N	2026-07-03 21:59:21.532801	2026-07-03 21:59:21.532801	1	\N
49	53	خطوة 3	\N	3	f	\N	1070	pending	\N	\N	\N	\N	2026-07-03 21:59:21.532801	2026-07-03 21:59:21.532801	1	\N
\.


--
-- Data for Name: task_workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_workflows (id, task_id, template_id, status, created_by, created_at, updated_at, deleted_at) FROM stdin;
53	1029	\N	pending	1	2026-07-03 21:49:19.236955	2026-07-03 21:49:19.236955	\N
46	1	\N	pending	1	2026-07-02 15:29:53.594248	2026-07-04 15:08:57.752234	\N
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, file_number, start_date, due_date, reminder_datetime, completed_at, is_urgent, is_important, priority, progress_percentage, status, created_by, department_id, urgency_requested_at, urgency_requested_by, urgency_request_status, created_at, updated_at, deleted_at) FROM stdin;
1011	مهمة2	مهمة2		2026-02-24 00:00:00	2026-03-24 00:00:00	2026-02-24 00:00:00	2026-03-21 16:51:35.342	t	f	LOW	0	COMPLETED	1060	104	2026-03-24 00:00:00	1061	APPROVED	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1012	مهمة3	مهمة3		2026-02-09 00:00:00	2026-03-09 00:00:00	2026-06-24 16:45:14.481	2026-06-10 16:51:49.78	f	t	MEDIUM	0	COMPLETED	1061	105	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1013	مهمة4	مهمة4		2026-06-01 00:00:00	2026-07-01 00:00:00	2026-06-24 16:45:14.481	\N	t	t	HIGH	0	IN_PROGRESS	1062	106	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1014	مهمة5	مهمة5		2026-06-02 00:00:00	2026-07-02 00:00:00	2026-06-24 16:45:14.481	2026-06-03 16:52:05.348	f	t	LOW	0	COMPLETED	1067	109	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1015	مهمة6	مهمة6		2026-06-03 00:00:00	2026-07-03 00:00:00	2026-06-24 16:45:14.481	2026-06-09 16:52:15.682	t	f	MEDIUM	0	COMPLETED	1069	116	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1016	مهمة7	مهمة7		2026-06-04 00:00:00	2026-07-04 00:00:00	2026-06-24 16:45:14.481	\N	f	t	CRITICAL	0	IN_PROGRESS	1070	114	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1017	مهمة8	مهمة8		2026-06-07 00:00:00	2026-07-07 00:00:00	2026-06-24 16:45:14.481	\N	t	f	MEDIUM	0	IN_PROGRESS	1071	121	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1019	مهمة10	مهمة10		2026-06-18 00:00:00	2026-07-18 00:00:00	2026-06-24 16:45:14.481	\N	t	f	MEDIUM	0	IN_PROGRESS	1061	129	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1020	مهمة11	مهمة11		2026-06-18 00:00:00	2026-07-18 00:00:00	2026-06-24 16:45:14.481	\N	f	t	HIGH	0	IN_PROGRESS	1071	134	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1021	مهمة12	مهمة12		2026-06-19 00:00:00	2026-07-19 00:00:00	2026-06-24 16:45:14.481	\N	t	f	CRITICAL	0	IN_PROGRESS	1069	115	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1022	مهمة13	مهمة13		2026-06-22 00:00:00	2026-07-22 00:00:00	2026-06-24 16:45:14.481	\N	f	t	MEDIUM	0	IN_PROGRESS	1071	110	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1023	مهمة14	مهمة14		2026-06-25 00:00:00	2026-07-25 00:00:00	2026-06-24 16:45:14.481	\N	t	f	HIGH	0	IN_PROGRESS	1071	108	\N	\N	\N	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1010	مهمة1	مهمة1		2026-01-01 00:00:00	2026-02-01 00:00:00	2026-06-24 16:45:14.481	\N	t	t	HIGH	0	IN_PROGRESS	1071	107	2026-02-02 16:57:16.049	1061	PENDING	2026-06-21 15:02:51.886908	2026-06-21 15:02:51.886908	\N
1018	مهمة9a	لماذا هذا هو الخيار الأفضل؟\nتناغم الألوان: لاحظ أننا استخدمنا (Emerald, Amber, Rose, Blue)؛ هذه الألوان هي المعيار في واجهات الإدارة الحديثة، وهي توفر تباينًا ممتازًا (Contrast) في الوضعين النهاري والليلي.\n\nمركزية التعديل: إذا طلبت منك الإدارة مستقبلاً تغيير لون المهام "المكتملة" إلى لون مختلف، لن تضطر للبحث في ملفات الجدول. ستغير قيمة completed في theme.js فقط، وسيتحدث شكل جميع البادجات في التطبيق بالكامل.\n\nالقابلية للتوسع: يمكنك إضافة أي حالة جديدة (مثل archived أو on_hold) في ثانية واحدة عبر إضافتها لملف الثيم فقط.		2026-06-28 03:00:00	2026-07-04 03:00:00	2026-06-30 21:50:00	\N	f	t	CRITICAL	70	IN_PROGRESS	1060	104	2026-06-24 20:13:31.325747	1	PENDING	2026-06-21 15:02:51.886908	2026-06-28 11:37:51.53146	\N
1025	sdf	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-06-28 22:49:20.605405	2026-06-28 22:49:20.481608	\N
1026	sdf	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-06-29 18:01:01.164224	2026-06-29 18:01:01.648389	\N
1027	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-06-30 15:33:35.70039	2026-06-30 15:33:48.370774	\N
1028	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-06-30 16:53:06.873358	2026-06-30 16:53:07.674318	\N
1029	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-06-30 21:29:48.433444	2026-06-30 21:29:49.098656	\N
1	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-02 11:57:31.226381	2026-07-02 11:57:31.807727	\N
\.


--
-- Data for Name: user_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_contacts (id, user_id, phone_number, whatsapp_number, telegram_username, extension_number, is_private, created_at, updated_at) FROM stdin;
1002	1060	01090018329	01090018329	as	\N	t	2026-06-10 17:23:43.889257	2026-06-10 17:23:43.889257
1004	1062	01090018255	01090018251	sdsd	110	f	2026-06-23 01:50:47.911512	2026-06-23 01:50:47.911512
\.


--
-- Data for Name: user_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_logs (id, user_id, action, old_data, new_data, created_at) FROM stdin;
8	1060	user_edited	null	{"employee_number": "1040", "full_name": "Amer hendy", "job_title": "chairman office manager", "email": "amerhendyali@gmail.com", "work_location_id": 1, "password_hash": "$2b$12$Ll2SL9R12U.yZWWJmnTQceTDrJjU56es3l3DcRSbxCeOIc8dxuti.", "updated_by": 1}	2026-06-10 17:05:09.600471
9	1060	user_edited	null	{"is_active": false, "activation_by": 1}	2026-06-10 17:11:10.091061
10	1060	password_change	null	{"changed_by": 1}	2026-06-10 17:16:07.957334
11	1	user changed their notification settings	{"browser": null, "email": null, "whatsapp": null, "telegram": null, "sms": null, "google": null}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-06-10 17:21:16.804087
12	1060	user changed their notification settings	{"browser": null, "email": null, "whatsapp": null, "telegram": null, "sms": null, "google": null}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-06-10 17:22:15.680952
13	1060	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-06-10 17:22:19.369711
14	1	user_created	null	{"employee_number": "100000", "full_name": "Amer Hendy", "job_title": "\\u0645\\u062f\\u064a\\u0631 \\u0639\\u0627\\u0645 \\u0627\\u0644\\u0646\\u0638\\u0627\\u0645", "email": "amer.hendy@yahoo.com", "work_location_id": 10, "manager_id": null, "job_level_id": 16, "department_id": 105, "global_role": "global_admin", "can_transfer_external": true, "created_by": 1, "user_id": 1061}	2026-06-10 17:25:30.92939
15	1060	user_edited	null	{"employee_number": "1040", "full_name": "Amer hendy", "job_title": "chairman office manager", "email": "amerhendyali@gmail.com", "work_location_id": 1, "manager_id": null, "job_level_id": 16, "department_id": null, "global_role": "user", "can_transfer_external": false, "is_active": false, "avatar_url": "full_name", "updated_by": 1}	2026-06-10 17:26:48.312428
16	1060	user_edited	null	{"is_active": true, "updated_by": 1061}	2026-06-14 18:37:49.029876
17	1060	user_edited	null	{"is_active": false, "updated_by": 1061}	2026-06-14 18:38:38.990719
18	1060	user_edited	null	{"is_active": true, "updated_by": 1061}	2026-06-14 18:38:40.719574
20	1060	user_edited	null	{"employee_number": "1040", "full_name": "Amer hendy", "job_title": "chairman office manager", "email": "amerhendyali@gmail.com", "work_location_id": 1, "manager_id": null, "job_level_id": 16, "department_id": 105, "global_role": "user", "can_transfer_external": false, "is_active": true, "avatar_url": "full_name", "updated_by": 1061}	2026-06-14 18:39:14.846869
25	1061	user_edited	null	{"employee_number": "100000", "full_name": "Amer Hendy", "job_title": "\\u0645\\u062f\\u064a\\u0631 \\u0639\\u0627\\u0645 \\u0627\\u0644\\u0646\\u0638\\u0627\\u0645", "email": "amer.hendy@yahoo.com", "work_location_id": 10, "manager_id": null, "job_level_id": 16, "department_id": 104, "global_role": "global_admin", "can_transfer_external": true, "is_active": true, "avatar_url": "full_name", "password_hash": "$2b$12$c4i9DuQdcSN0sTfK6VVlXOVgY6dXALgGSyr4SQeNMnOZo0c2Vh5AG", "updated_by": 1061}	2026-06-14 18:47:52.712639
26	1060	user_edited	null	{"employee_number": "1040", "full_name": "Amer hendy", "job_title": "chairman office manager", "email": "amerhendyali@gmail.com", "work_location_id": 1, "manager_id": null, "job_level_id": 16, "department_id": 105, "global_role": "user", "can_transfer_external": false, "is_active": true, "avatar_url": "full_name", "updated_by": 1061}	2026-06-14 18:48:01.832539
27	1060	user_edited	null	{"employee_number": "1040", "full_name": "Amer hendy", "job_title": "chairman office manager", "email": "amerhendyali@gmail.com", "work_location_id": 1, "manager_id": null, "job_level_id": 20, "department_id": 105, "global_role": "user", "can_transfer_external": false, "is_active": true, "avatar_url": "full_name", "updated_by": 1061}	2026-06-16 19:06:10.512093
28	1061	user_created	null	{"employee_number": "000007", "full_name": "\\u0627\\u0628\\u0631\\u0627\\u0647\\u064a\\u0645 \\u0639\\u064a\\u062f", "job_title": "amer.hendy@yahoo.com", "email": "ebrahimeid@gmail.com", "work_location_id": 13, "manager_id": 1060, "job_level_id": 22, "department_id": 105, "global_role": "user", "can_transfer_external": true, "created_by": 1061, "user_id": 1062}	2026-06-16 19:21:47.679796
29	1060	user_edited	null	{"employee_number": "1040", "full_name": "Amer hendy", "job_title": "chairman office manager", "email": "amerhendyali@gmail.com", "work_location_id": 1, "manager_id": null, "job_level_id": 20, "department_id": 105, "global_role": "user", "can_transfer_external": false, "is_active": true, "avatar_url": "full_name", "password_hash": "$2b$12$gCk5VKoaBItDPpnVLly1JemHeIlRuWvmFG4oXpiaSlnI/tL0SStIK", "updated_by": 1061}	2026-06-16 19:22:09.61903
30	1060	user_edited	null	{"full_name": "\\u062e\\u0627\\u0644\\u062f", "updated_by": 1060}	2026-06-28 07:21:32.852536
31	1060	user_edited	null	{"full_name": "Amer Hendy", "updated_by": 1060}	2026-06-28 07:21:46.133113
32	1060	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-06-28 07:39:14.710266
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_number, full_name, job_title, work_location_id, email, password_hash, google_id, job_level_id, department_id, global_role, can_transfer_external, is_active, avatar_url, last_login, created_at, updated_at) FROM stdin;
1067	000008	tarsk agrody	مدير عام ش ق	13	emai1l@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	20	105	USER	f	t	\N	\N	2026-06-23 17:12:28.039991	2026-06-23 17:12:28.039991
1069	000009	medhat	مدير مكتب فنى للشئون قانونية	13	emai2l@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	22	132	USER	f	t	\N	\N	2026-06-23 17:12:41.415383	2026-06-23 17:12:41.415383
1071	0000011	mido	رئيس قطاع	13	ema4il@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	19	106	USER	f	t	\N	\N	2026-06-23 17:12:41.423605	2026-06-23 17:12:41.423605
1062	000007	ابراهيم عيد	amer.hendy@yahoo.com	13	ebrahimeid@gmail.com	$2b$12$z8Ot90eIoruZ/QKfQbJo8eADvxhUWatFQQUUHv4pfVXXxPY0N/jei	\N	22	105	USER	t	t	\N	2026-06-23 16:14:18.545151	2026-06-16 19:21:47.307083	2026-06-23 16:14:18.277359
1070	000010	aburaia	lسكرتير	13	ema3il@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	29	129	USER	f	t	\N	2026-06-28 07:16:25.022432	2026-06-23 17:12:41.419671	2026-06-28 07:16:24.73676
1060	1040	Amer Hendy	chairman office manager	1	amerhendyali@gmail.com	$2b$12$gCk5VKoaBItDPpnVLly1JemHeIlRuWvmFG4oXpiaSlnI/tL0SStIK	\N	20	105	USER	f	t	full_name	2026-06-28 07:17:47.252122	2026-06-10 16:52:18.151675	2026-06-28 07:21:46.10737
1061	100000	Amer Hendy	مدير عام النظام	10	amer.hendy@yahoo.com	$2b$12$c4i9DuQdcSN0sTfK6VVlXOVgY6dXALgGSyr4SQeNMnOZo0c2Vh5AG	\N	16	104	GLOBAL_ADMIN	t	t		2026-07-01 21:26:57.167381	2026-06-10 17:25:30.65198	2026-07-01 21:26:56.504245
1	0000001	System Developer	System Developer	13	global.admin@company.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	17	104	GLOBAL_ADMIN	f	t	https://randomuser.me/api/portraits/men/0.jpg	2026-07-04 12:00:58.947852	2026-06-02 00:25:31.840789	2026-07-04 12:00:58.346666
\.


--
-- Data for Name: workflow_template_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_template_steps (id, template_id, title, description, step_order, is_parallel, assigned_department_id, assigned_user_id, created_at, deleted_at) FROM stdin;
1	1	عنوان الخطوة	الوصف	1	f	104	\N	2026-06-29 19:24:37.73083	\N
2	1	خطوة1	وصف1	2	f	104	\N	2026-06-29 19:26:04.239174	\N
3	3	خطوة1	\N	1	f	113	\N	2026-07-02 18:01:10.61436	\N
5	3	خطوة2أ	\N	2	t	114	\N	2026-07-02 18:07:15.820873	\N
4	3	خطوة4	\N	2	t	114	\N	2026-07-02 18:06:59.784214	\N
\.


--
-- Data for Name: workflow_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_templates (id, name, description, is_active, created_by, created_at, updated_at, deleted_at) FROM stdin;
3	مستخلص	وصف مستخلص	t	1	2026-07-02 17:52:56.123222	2026-07-02 17:58:11.469879	\N
1	اول ورك فلو	وصف	t	1	2026-06-29 19:24:37.73083	2026-06-30 21:35:14.870974	\N
\.


--
-- Name: delegations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delegations_id_seq', 1, false);


--
-- Name: department_managers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_managers_id_seq', 1, false);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- Name: job_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_levels_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 1, false);


--
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 2, true);


--
-- Name: recurring_task_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_task_logs_id_seq', 1, true);


--
-- Name: recurring_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_tasks_id_seq', 1, false);


--
-- Name: task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_assignments_id_seq', 1, false);


--
-- Name: task_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_attachments_id_seq', 1, false);


--
-- Name: task_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_comments_id_seq', 1, false);


--
-- Name: task_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_logs_id_seq', 1, false);


--
-- Name: task_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_shares_id_seq', 1, false);


--
-- Name: task_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_steps_id_seq', 1, false);


--
-- Name: task_time_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_time_logs_id_seq', 1, false);


--
-- Name: task_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_transfers_id_seq', 1, false);


--
-- Name: task_workflow_step_dependencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_workflow_step_dependencies_id_seq', 9, true);


--
-- Name: task_workflow_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_workflow_steps_id_seq', 192, true);


--
-- Name: task_workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_workflows_id_seq', 53, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, true);


--
-- Name: user_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_contacts_id_seq', 1, false);


--
-- Name: user_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_logs_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: workflow_template_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_template_steps_id_seq', 5, true);


--
-- Name: workflow_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workflow_templates_id_seq', 3, true);


--
-- Name: delegations delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_pkey PRIMARY KEY (id);


--
-- Name: department_managers department_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_managers
    ADD CONSTRAINT department_managers_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: job_levels job_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_levels
    ADD CONSTRAINT job_levels_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: recurring_task_logs recurring_task_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_task_logs
    ADD CONSTRAINT recurring_task_logs_pkey PRIMARY KEY (id);


--
-- Name: recurring_tasks recurring_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: task_logs task_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT task_logs_pkey PRIMARY KEY (id);


--
-- Name: task_shares task_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares
    ADD CONSTRAINT task_shares_pkey PRIMARY KEY (id);


--
-- Name: task_steps task_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps
    ADD CONSTRAINT task_steps_pkey PRIMARY KEY (id);


--
-- Name: task_time_logs task_time_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_time_logs
    ADD CONSTRAINT task_time_logs_pkey PRIMARY KEY (id);


--
-- Name: task_transfers task_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_pkey PRIMARY KEY (id);


--
-- Name: task_workflow_step_dependencies task_workflow_step_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_step_dependencies
    ADD CONSTRAINT task_workflow_step_dependencies_pkey PRIMARY KEY (id);


--
-- Name: task_workflow_steps task_workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_steps
    ADD CONSTRAINT task_workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: task_workflows task_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflows
    ADD CONSTRAINT task_workflows_pkey PRIMARY KEY (id);


--
-- Name: task_workflows task_workflows_task_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflows
    ADD CONSTRAINT task_workflows_task_id_key UNIQUE (task_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: department_managers unique_user_department; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_managers
    ADD CONSTRAINT unique_user_department UNIQUE (user_id, department_id);


--
-- Name: favorites uq_favorite; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT uq_favorite UNIQUE (user_id, task_id);


--
-- Name: task_shares uq_share; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares
    ADD CONSTRAINT uq_share UNIQUE (task_id, shared_with_user_id);


--
-- Name: task_assignments uq_task_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT uq_task_user UNIQUE (task_id, user_id);


--
-- Name: user_contacts user_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_contacts
    ADD CONSTRAINT user_contacts_pkey PRIMARY KEY (id);


--
-- Name: user_contacts user_contacts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_contacts
    ADD CONSTRAINT user_contacts_user_id_key UNIQUE (user_id);


--
-- Name: user_logs user_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_logs
    ADD CONSTRAINT user_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_number_key UNIQUE (employee_number);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflow_template_steps workflow_template_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_template_steps
    ADD CONSTRAINT workflow_template_steps_pkey PRIMARY KEY (id);


--
-- Name: workflow_templates workflow_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_pkey PRIMARY KEY (id);


--
-- Name: ix_recurring_task_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recurring_task_logs_id ON public.recurring_task_logs USING btree (id);


--
-- Name: ix_recurring_tasks_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recurring_tasks_deleted_at ON public.recurring_tasks USING btree (deleted_at);


--
-- Name: ix_task_assignments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_task_assignments_deleted_at ON public.task_assignments USING btree (deleted_at);


--
-- Name: ix_task_workflow_step_dependencies_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_task_workflow_step_dependencies_id ON public.task_workflow_step_dependencies USING btree (id);


--
-- Name: ix_task_workflow_steps_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_task_workflow_steps_id ON public.task_workflow_steps USING btree (id);


--
-- Name: ix_task_workflows_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_task_workflows_id ON public.task_workflows USING btree (id);


--
-- Name: ix_tasks_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_deleted_at ON public.tasks USING btree (deleted_at);


--
-- Name: ix_user_contacts_whatsapp_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_contacts_whatsapp_number ON public.user_contacts USING btree (whatsapp_number);


--
-- Name: ix_workflow_template_steps_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_workflow_template_steps_id ON public.workflow_template_steps USING btree (id);


--
-- Name: ix_workflow_templates_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_workflow_templates_id ON public.workflow_templates USING btree (id);


--
-- Name: delegations delegations_delegate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_delegate_id_fkey FOREIGN KEY (delegate_id) REFERENCES public.users(id);


--
-- Name: delegations delegations_delegator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_delegator_id_fkey FOREIGN KEY (delegator_id) REFERENCES public.users(id);


--
-- Name: department_managers department_managers_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_managers
    ADD CONSTRAINT department_managers_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: department_managers department_managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_managers
    ADD CONSTRAINT department_managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: departments departments_job_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_job_level_id_fkey FOREIGN KEY (job_level_id) REFERENCES public.job_levels(id);


--
-- Name: departments departments_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: favorites favorites_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_related_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_task_id_fkey FOREIGN KEY (related_task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_logs recurring_task_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT recurring_task_id FOREIGN KEY (id) REFERENCES public.recurring_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recurring_task_logs recurring_task_logs_recurring_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_task_logs
    ADD CONSTRAINT recurring_task_logs_recurring_task_id_fkey FOREIGN KEY (recurring_task_id) REFERENCES public.recurring_tasks(id) ON DELETE CASCADE;


--
-- Name: recurring_tasks recurring_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: recurring_tasks recurring_tasks_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_tasks
    ADD CONSTRAINT recurring_tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: task_assignments task_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: task_assignments task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_attachments task_attachments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_attachments task_attachments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_logs task_logs_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT task_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_logs task_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT task_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_shares task_shares_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares
    ADD CONSTRAINT task_shares_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: task_shares task_shares_shared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares
    ADD CONSTRAINT task_shares_shared_by_fkey FOREIGN KEY (shared_by) REFERENCES public.users(id);


--
-- Name: task_shares task_shares_shared_with_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares
    ADD CONSTRAINT task_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES public.users(id);


--
-- Name: task_shares task_shares_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_shares
    ADD CONSTRAINT task_shares_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_steps task_steps_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps
    ADD CONSTRAINT task_steps_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(id);


--
-- Name: task_steps task_steps_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps
    ADD CONSTRAINT task_steps_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id);


--
-- Name: task_steps task_steps_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps
    ADD CONSTRAINT task_steps_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: task_steps task_steps_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps
    ADD CONSTRAINT task_steps_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_time_logs task_time_logs_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_time_logs
    ADD CONSTRAINT task_time_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_time_logs task_time_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_time_logs
    ADD CONSTRAINT task_time_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_transfers task_transfers_from_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_from_department_id_fkey FOREIGN KEY (from_department_id) REFERENCES public.departments(id);


--
-- Name: task_transfers task_transfers_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: task_transfers task_transfers_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_transfers task_transfers_to_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_to_department_id_fkey FOREIGN KEY (to_department_id) REFERENCES public.departments(id);


--
-- Name: task_transfers task_transfers_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: task_workflow_step_dependencies task_workflow_step_dependencies_child_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_step_dependencies
    ADD CONSTRAINT task_workflow_step_dependencies_child_step_id_fkey FOREIGN KEY (child_step_id) REFERENCES public.task_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: task_workflow_step_dependencies task_workflow_step_dependencies_parent_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_step_dependencies
    ADD CONSTRAINT task_workflow_step_dependencies_parent_step_id_fkey FOREIGN KEY (parent_step_id) REFERENCES public.task_workflow_steps(id) ON DELETE CASCADE;


--
-- Name: task_workflow_steps task_workflow_steps_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_steps
    ADD CONSTRAINT task_workflow_steps_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: task_workflow_steps task_workflow_steps_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_steps
    ADD CONSTRAINT task_workflow_steps_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: task_workflow_steps task_workflow_steps_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_steps
    ADD CONSTRAINT task_workflow_steps_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: task_workflow_steps task_workflow_steps_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflow_steps
    ADD CONSTRAINT task_workflow_steps_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.task_workflows(id) ON DELETE CASCADE;


--
-- Name: task_workflows task_workflows_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflows
    ADD CONSTRAINT task_workflows_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: task_workflows task_workflows_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflows
    ADD CONSTRAINT task_workflows_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_workflows task_workflows_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_workflows
    ADD CONSTRAINT task_workflows_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workflow_templates(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: tasks tasks_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: tasks tasks_urgency_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_urgency_requested_by_fkey FOREIGN KEY (urgency_requested_by) REFERENCES public.users(id);


--
-- Name: user_contacts user_contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_contacts
    ADD CONSTRAINT user_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_logs user_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_logs
    ADD CONSTRAINT user_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_job_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_job_level_id_fkey FOREIGN KEY (job_level_id) REFERENCES public.job_levels(id);


--
-- Name: users users_work_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_work_location_id_fkey FOREIGN KEY (work_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: workflow_template_steps workflow_template_steps_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_template_steps
    ADD CONSTRAINT workflow_template_steps_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: workflow_template_steps workflow_template_steps_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_template_steps
    ADD CONSTRAINT workflow_template_steps_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workflow_template_steps workflow_template_steps_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_template_steps
    ADD CONSTRAINT workflow_template_steps_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.workflow_templates(id) ON DELETE CASCADE;


--
-- Name: workflow_templates workflow_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict EnH5nKBOv9hRfI2Sb2wGXf1hilXcOSGhyxPOBpvW7kJXfnB1E9U0oIu0CLAgp1b

