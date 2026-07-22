--
-- PostgreSQL database dump
--

\restrict nhlpsh3deDD3Zfg6nQ5Y1VSfgPrSMTnl497cJwdvAGfsIpE7e1YJEJsvr5oPjS3

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
-- Name: stepstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.stepstatus AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.stepstatus OWNER TO postgres;

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
    is_active boolean NOT NULL,
    parent_id integer
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
-- Name: task_step_dependencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_step_dependencies (
    id integer NOT NULL,
    parent_step_id integer NOT NULL,
    child_step_id integer NOT NULL
);


ALTER TABLE public.task_step_dependencies OWNER TO postgres;

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
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    parent_id integer,
    deleted_at timestamp without time zone
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

ALTER SEQUENCE public.task_workflow_step_dependencies_id_seq OWNED BY public.task_step_dependencies.id;


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
-- Name: task_step_dependencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_step_dependencies ALTER COLUMN id SET DEFAULT nextval('public.task_workflow_step_dependencies_id_seq'::regclass);


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
2	2	104	t	2026-07-13 19:09:58.878	2026-07-13 19:10:01.308	\N
3	1067	104	f	2026-07-13 19:10:56.607995	2026-07-20 17:29:04.926787	2026-07-20 17:29:04.951072
4	1071	106	t	2026-07-20 18:23:59.394068	2026-07-20 18:23:59.394068	\N
5	1072	109	t	2026-07-20 18:31:38.69948	2026-07-20 18:31:38.69948	\N
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
10	1	1	2026-07-14 18:08:49.640886
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

COPY public.locations (id, name, is_active, parent_id) FROM stdin;
13	الديوان العام	t	\N
14	جنوب سيناء	t	\N
12	string	t	14
5	الحسنة	t	15
17	دهب	t	14
18	نويبع	t	14
10	سانت كاترين	t	14
11	شرم الشيخ	t	14
16	بئر العبد	t	15
2	الشيخ زويد	t	15
6	رفح	t	15
3	نخل	t	15
7	ابورديس	t	14
4	رأس سدر	t	14
8	ابوزنيمة	t	14
9	طور سيناء	t	14
1	العريش	t	15
20	رمانة	t	16
19	بالوظة	t	16
15	شمال سيناء	t	\N
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
3	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'xxxxxxxx' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 18:38:54.099414	\N
5	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 18:40:16.515403	\N
9	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 19:25:22.029775	\N
11	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 19:28:51.982026	\N
13	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 16:40:11.942646	\N
15	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 16:40:43.788339	\N
50	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:20:53.001124	\N
52	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:21:59.435887	\N
59	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:54:07.697297	\N
73	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:31:31.313143	\N
80	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:44:19.288939	\N
301	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.489605	\N
84	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:54:42.845314	\N
87	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'f' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-08 18:22:41.918259	\N
304	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.59248	\N
307	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.649092	\N
310	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.505326	\N
313	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.557292	\N
317	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.601475	\N
320	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.660447	\N
324	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.644515	\N
327	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.690057	\N
331	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:05.94887	\N
334	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:06.00016	\N
337	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.494955	\N
340	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.539822	\N
344	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.834151	\N
347	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.881279	\N
351	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.34961	\N
354	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.393133	\N
4	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 18:39:37.41791	\N
6	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'ؤؤؤؤؤؤؤؤؤ' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 18:49:55.12484	\N
8	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 18:59:57.273381	\N
12	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 19:29:51.636787	\N
14	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 16:40:34.894216	\N
18	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 16:51:52.655545	\N
51	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:21:03.125694	\N
63	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:56:58.869923	\N
65	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:57:31.019211	\N
67	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:12:05.259454	\N
68	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:16:19.303793	\N
71	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:17:45.52493	\N
72	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:31:18.94549	\N
74	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:41:18.505147	\N
75	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:41:21.227145	\N
77	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:42:26.126566	\N
78	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:43:45.571221	\N
79	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:43:52.46144	\N
81	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:44:45.204725	\N
88	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'asd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-08 18:24:22.069805	\N
302	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.550028	\N
305	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.613338	\N
308	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.445985	\N
311	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.526936	\N
314	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.572982	\N
315	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.570483	\N
318	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.621151	\N
321	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.677131	\N
322	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.609545	\N
325	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.65977	\N
328	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.705324	\N
329	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:05.91527	\N
332	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:05.966403	\N
7	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 18:59:29.640623	\N
10	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-05 19:25:56.112581	\N
16	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 16:48:29.05467	\N
17	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 16:51:12.322176	\N
53	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:22:06.563078	\N
76	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:41:49.059477	\N
303	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.570266	\N
89	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة 'dfssd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-08 18:25:14.362676	\N
90	1	step_created	تم إضافة خطوة جديدة	تم إضافة الخطوة '12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	2026-07-08 20:17:49.230499	2026-07-08 18:25:59.960579	\N
306	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:32.631409	\N
309	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.478894	\N
312	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:44.542075	\N
316	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.58718	\N
319	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:21:51.645324	\N
323	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.626835	\N
326	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:01.675045	\N
330	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:05.933634	\N
333	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:05.980481	\N
336	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.475694	\N
339	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.523876	\N
342	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.568254	\N
343	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.816665	\N
346	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.86358	\N
349	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.906667	\N
350	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.33165	\N
353	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.38175	\N
356	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.417593	\N
357	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.805529	\N
360	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.859804	\N
363	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.899382	\N
364	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.047433	\N
367	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.092408	\N
54	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:22:16.09285	\N
55	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:22:26.858358	\N
56	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:22:47.144801	\N
335	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:06.014141	\N
338	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.509341	\N
341	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:11.551728	\N
345	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.848115	\N
348	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:16.893643	\N
352	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.366823	\N
355	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:19.405791	\N
359	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.845831	\N
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
57	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:53:41.643056	\N
58	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:53:53.901639	\N
60	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:54:20.442783	\N
61	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:54:29.413044	\N
62	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:56:17.413398	\N
64	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 19:57:18.252314	\N
66	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:11:06.707022	\N
69	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:17:00.282415	\N
70	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-06 20:17:03.427286	\N
358	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.828541	\N
361	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.873385	\N
365	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.06285	\N
368	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.14415	\N
372	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:25.930784	\N
375	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:25.975561	\N
379	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.38964	\N
382	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.433961	\N
386	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.564397	\N
389	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.615544	\N
393	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:40.958909	\N
396	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:41.002745	\N
399	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.462744	\N
402	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.670516	\N
405	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.763145	\N
406	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.658497	\N
409	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.706669	\N
412	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.764349	\N
413	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.161213	\N
416	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.208278	\N
419	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.251843	\N
420	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.296841	\N
423	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.337377	\N
426	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.376163	\N
427	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.289762	\N
430	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.337384	\N
433	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.381031	\N
436	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.09852	\N
439	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.135799	\N
499	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.30801	\N
502	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.344156	\N
506	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.279587	\N
362	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:21.886268	\N
366	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.076414	\N
369	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.188708	\N
373	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:25.947871	\N
376	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:25.992465	\N
380	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.403101	\N
383	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.450503	\N
387	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.583197	\N
390	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.627966	\N
394	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:40.974962	\N
397	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:41.015065	\N
400	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.489845	\N
403	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.703694	\N
407	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.674576	\N
410	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.721061	\N
414	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.177339	\N
417	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.222544	\N
421	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.310462	\N
424	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.349646	\N
428	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.305523	\N
431	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.355628	\N
434	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.068323	\N
437	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.110918	\N
440	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.147431	\N
509	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.316134	\N
513	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.64543	\N
516	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.684928	\N
520	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.237704	\N
523	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.275315	\N
526	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.407541	\N
529	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.445267	\N
533	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.925547	\N
370	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:23.228422	\N
371	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:25.913877	\N
374	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:25.961864	\N
377	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 48' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:26.005954	\N
378	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.371866	\N
381	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.418181	\N
384	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 47' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:28.467646	\N
385	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.541014	\N
388	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.599508	\N
391	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:32.64221	\N
392	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:40.940711	\N
395	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:40.990458	\N
398	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:41.02944	\N
401	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.570424	\N
404	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 16' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:45.725578	\N
408	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.688519	\N
411	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:22:53.746409	\N
415	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.191431	\N
418	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:00.238812	\N
422	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.323249	\N
425	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:04.362518	\N
429	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.319495	\N
432	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:08.36953	\N
435	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.084858	\N
438	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 5' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:21.123809	\N
534	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.939945	\N
536	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.966849	\N
537	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.976735	\N
538	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.99329	\N
539	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.767833	\N
540	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.789438	\N
541	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.830987	\N
441	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.793782	\N
444	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.847874	\N
447	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.880265	\N
448	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.609786	\N
451	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.655961	\N
454	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.690254	\N
455	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.567048	\N
458	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.609097	\N
461	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.641605	\N
464	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.095617	\N
467	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.136338	\N
471	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.672413	\N
474	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.715572	\N
478	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.690682	\N
481	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.728113	\N
485	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.171433	\N
488	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.204147	\N
491	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.401419	\N
494	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.443236	\N
498	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.297257	\N
501	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.332806	\N
505	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.266229	\N
508	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.303383	\N
512	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.633407	\N
515	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.674012	\N
519	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.22583	\N
522	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.263147	\N
525	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.393443	\N
528	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.43236	\N
531	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.47012	\N
532	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.912845	\N
535	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:49.95176	\N
442	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.815201	\N
445	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.859874	\N
449	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.626335	\N
452	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.667924	\N
456	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.582638	\N
459	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.619357	\N
462	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.068444	\N
465	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.108982	\N
468	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.147635	\N
469	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.643395	\N
472	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.684224	\N
475	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.726062	\N
476	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.660643	\N
479	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.702008	\N
482	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.7416	\N
483	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.145633	\N
486	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.183235	\N
489	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.214916	\N
492	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.416123	\N
227	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:50.556191	\N
228	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:50.582299	\N
229	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:50.598433	\N
230	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:50.612371	\N
231	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:51.949501	\N
232	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:51.967874	\N
233	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:51.985075	\N
234	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:52.001107	\N
235	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:52.014732	\N
236	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:52.027609	\N
237	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:52.040792	\N
495	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.454262	\N
238	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.324712	\N
240	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.362803	\N
242	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.392703	\N
244	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.423121	\N
246	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.612442	\N
248	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.692586	\N
250	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.72812	\N
252	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.334393	\N
254	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.379837	\N
256	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.417934	\N
258	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.443945	\N
260	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.581489	\N
262	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.617469	\N
264	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.645922	\N
266	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.570522	\N
268	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.612231	\N
270	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.654503	\N
272	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.686568	\N
273	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.507116	\N
275	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.54618	\N
277	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.570753	\N
279	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.592205	\N
281	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:41.00051	\N
283	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:41.032083	\N
285	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:41.061177	\N
288	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.550299	\N
290	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.585557	\N
292	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.625139	\N
295	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.270457	\N
297	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.303347	\N
299	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.33593	\N
239	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.346959	\N
241	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.376569	\N
243	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 18:56:53.409949	\N
245	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.570058	\N
247	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.663988	\N
249	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.711128	\N
251	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:13.749291	\N
253	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.358048	\N
255	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.403388	\N
257	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'dsfsdfsdfsd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:04:19.431175	\N
259	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.564715	\N
261	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.6005	\N
263	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.633057	\N
265	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:25.658424	\N
267	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.583906	\N
269	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.639351	\N
271	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:30.671199	\N
274	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.526931	\N
276	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.559391	\N
278	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxdbbbbbbbbb' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:36.581645	\N
280	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:40.98708	\N
282	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:41.015878	\N
284	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:41.048621	\N
286	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:08:41.07726	\N
287	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.520204	\N
289	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.569899	\N
291	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.601907	\N
293	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'xxxxxxxxd' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:09:37.642381	\N
294	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.159813	\N
296	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.287159	\N
298	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.319573	\N
300	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'عناون الخطوة' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:10:23.34897	\N
443	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.832407	\N
446	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:29.869614	\N
450	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.640231	\N
453	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:31.679162	\N
457	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.595929	\N
460	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 14' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:38.630108	\N
463	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.082836	\N
466	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 15' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:43.121474	\N
470	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.658526	\N
473	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:52.700832	\N
477	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.674886	\N
480	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:23:57.71382	\N
484	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.160352	\N
487	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:06.19433	\N
490	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.385225	\N
493	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.430477	\N
496	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:12.467824	\N
497	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.281973	\N
500	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.319609	\N
503	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:16.354594	\N
504	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.25027	\N
507	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.29148	\N
510	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:21.326874	\N
511	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.622401	\N
514	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.661614	\N
517	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:25.697408	\N
518	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.210047	\N
521	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.251085	\N
524	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:33.285102	\N
527	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.418922	\N
530	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:24:45.457333	\N
542	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.841803	\N
545	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.877057	\N
546	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.073465	\N
549	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.118825	\N
552	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.149815	\N
555	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.733263	\N
558	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.778454	\N
956	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	13	{"automation": true, "template_id": 154}	\N	2026-07-19 15:19:23.994529	\N
957	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	13	{"automation": true, "template_id": 154}	\N	2026-07-19 15:19:23.994529	\N
958	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	13	{"automation": true, "template_id": 154}	\N	2026-07-19 15:19:23.994529	\N
959	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	14	{"automation": true, "template_id": 154}	\N	2026-07-20 14:56:34.142073	\N
961	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	14	{"automation": true, "template_id": 154}	\N	2026-07-20 14:56:34.142073	\N
960	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	14	{"automation": true, "template_id": 154}	2026-07-20 15:37:21.254871	2026-07-20 14:56:34.142073	\N
962	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	15	{"automation": true, "template_id": 154}	\N	2026-07-20 17:10:51.258586	\N
963	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	15	{"automation": true, "template_id": 154}	\N	2026-07-20 17:10:51.258586	\N
964	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	15	{"automation": true, "template_id": 154}	2026-07-20 17:13:43.853925	2026-07-20 17:10:51.258586	\N
965	1072	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (مهمة مكررة). يرجى المتابعة والبدء في التنفيذ.	16	{"automation": true, "template_id": 154}	\N	2026-07-21 13:53:22.3106	\N
966	1072	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (مهمة مكررة). يرجى المتابعة والبدء في التنفيذ.	17	{"automation": true, "template_id": 154}	\N	2026-07-22 00:16:12.561075	\N
543	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.854563	\N
547	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.094809	\N
550	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.129487	\N
553	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.707804	\N
556	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.750536	\N
559	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.79186	\N
544	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 11' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:00.866025	\N
548	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.106314	\N
551	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:09.139972	\N
554	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.720907	\N
557	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 10' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:14.765443	\N
560	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.508956	\N
561	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.527471	\N
562	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.539162	\N
563	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.550989	\N
564	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.561552	\N
565	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.572517	\N
566	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:26.581741	\N
567	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.75479	\N
568	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.777531	\N
569	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.805819	\N
570	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.825716	\N
571	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.837711	\N
572	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.847773	\N
573	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 12' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:31.859044	\N
574	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.469621	\N
575	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.482735	\N
576	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.501306	\N
577	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.513037	\N
578	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.522523	\N
579	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.536633	\N
580	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 7' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:25:35.546721	\N
581	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.683604	\N
582	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.732905	\N
583	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.756843	\N
584	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.772822	\N
585	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.788126	\N
586	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.801898	\N
587	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:35:52.81449	\N
589	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.364709	\N
591	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.397006	\N
593	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.428124	\N
596	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.344757	\N
598	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.380601	\N
600	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.413224	\N
603	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.154483	\N
605	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.217164	\N
607	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.255625	\N
609	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.237726	\N
611	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.296268	\N
613	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.325637	\N
615	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.356712	\N
616	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.819692	\N
618	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.876752	\N
620	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.926016	\N
622	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.959208	\N
588	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.338103	\N
590	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.381265	\N
592	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.411462	\N
594	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:04.442723	\N
595	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.327657	\N
597	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.364032	\N
599	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.395464	\N
601	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:36:18.441065	\N
602	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.118229	\N
604	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.184479	\N
606	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.238848	\N
608	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:37:49.271997	\N
610	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.27907	\N
612	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.310589	\N
614	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:04.340798	\N
617	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.858019	\N
619	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.910129	\N
621	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:39:53.943507	\N
623	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.366086	\N
624	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.443249	\N
625	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.489405	\N
626	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.509362	\N
627	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.565282	\N
628	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.600696	\N
629	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:41:13.628536	\N
630	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.481826	\N
631	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.522261	\N
632	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.541734	\N
633	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.559786	\N
634	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.574174	\N
635	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.58801	\N
636	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:42:05.6042	\N
637	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.204676	\N
638	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.245749	\N
639	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.264166	\N
640	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.288985	\N
641	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.306258	\N
642	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.324884	\N
643	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:06.342039	\N
644	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:41.86307	\N
645	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:42.306003	\N
646	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:42.334471	\N
647	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:42.366461	\N
648	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:42.389397	\N
649	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:42.407601	\N
650	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:45:42.425003	\N
651	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.07508	\N
652	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.108974	\N
653	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.145665	\N
654	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.159162	\N
655	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.174477	\N
656	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.19048	\N
657	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:46:30.203189	\N
658	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.073072	\N
659	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.09536	\N
660	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.124836	\N
661	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.140593	\N
662	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.156152	\N
663	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.171189	\N
664	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:03.188546	\N
665	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.136937	\N
666	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.156575	\N
667	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.175245	\N
668	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.195156	\N
669	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.212015	\N
670	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.236401	\N
671	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:25.253223	\N
672	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.817821	\N
673	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.845383	\N
674	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.866395	\N
675	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.889172	\N
676	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.918861	\N
677	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.938626	\N
678	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 50' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:47:53.963721	\N
679	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.813524	\N
680	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.839209	\N
681	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.85851	\N
682	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.875757	\N
683	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.888871	\N
684	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.902744	\N
685	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 49' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 20:48:08.915303	\N
686	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.589578	\N
687	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.653894	\N
688	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.679473	\N
689	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.699082	\N
690	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.716873	\N
691	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.733705	\N
692	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:03:57.749363	\N
693	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.386075	\N
694	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.475452	\N
695	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.505796	\N
696	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.523366	\N
697	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.562177	\N
698	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.579747	\N
699	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:05.599636	\N
700	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.08931	\N
701	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.112985	\N
703	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.155502	\N
705	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.191621	\N
707	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.048474	\N
709	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.164964	\N
711	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.206955	\N
713	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.254374	\N
715	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.784232	\N
717	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.816719	\N
719	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.847349	\N
702	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.138872	\N
704	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.172582	\N
706	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:05:38.210236	\N
708	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.110406	\N
710	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.189165	\N
712	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:07:39.222711	\N
714	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.768459	\N
716	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.800335	\N
718	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.832374	\N
720	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:08:05.86158	\N
721	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.564997	\N
722	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.600743	\N
723	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.619577	\N
724	1062	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.634833	\N
725	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.652695	\N
726	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.6719	\N
727	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 33' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-13 21:10:00.696799	\N
728	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	8	{"automation": true, "template_id": 154}	\N	2026-07-14 16:54:22.347854	\N
729	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	8	{"automation": true, "template_id": 154}	\N	2026-07-14 16:54:22.347854	\N
730	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	8	{"automation": true, "template_id": 154}	\N	2026-07-14 16:54:22.347854	\N
731	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	9	{"automation": true, "template_id": 154}	\N	2026-07-14 17:49:01.775817	\N
732	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	9	{"automation": true, "template_id": 154}	\N	2026-07-14 17:49:01.775817	\N
733	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	9	{"automation": true, "template_id": 154}	\N	2026-07-14 17:49:01.775817	\N
734	1071	transfer_request	طلب تحويل مهمة	تم إرسال مهمة "These utilities only support the browser keywords auto, thin, and none.\n\n" من مجلس ادارة الشركة إليك في قطاع التخطيط	1	{"from_user_id": 1}	\N	2026-07-14 18:34:47.86267	\N
767	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	10	{"automation": true, "template_id": 154}	\N	2026-07-14 19:31:20.445403	\N
768	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	10	{"automation": true, "template_id": 154}	\N	2026-07-14 19:31:20.445403	\N
769	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	10	{"automation": true, "template_id": 154}	\N	2026-07-14 19:31:20.445403	\N
770	1	step_created	تم إضافة خطوة فرعية جديدة	تم إضافة الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:42:15.424279	\N
771	2	step_created	تم إضافة خطوة فرعية جديدة	تم إضافة الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:42:15.442029	\N
772	1061	step_created	تم إضافة خطوة فرعية جديدة	تم إضافة الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:42:15.460236	\N
773	1067	step_created	تم إضافة خطوة فرعية جديدة	تم إضافة الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:42:15.476869	\N
774	1070	step_created	تم إضافة خطوة فرعية جديدة	تم إضافة الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:42:15.493713	\N
775	1071	step_created	تم إضافة خطوة فرعية جديدة	تم إضافة الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:42:15.50566	\N
776	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:56:28.31578	\N
777	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:56:28.352615	\N
778	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:56:28.364952	\N
779	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:56:28.3785	\N
780	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:56:28.390372	\N
781	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:56:28.401972	\N
782	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:03.673273	\N
783	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:03.694444	\N
784	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:03.71433	\N
785	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:03.728702	\N
786	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:03.744805	\N
787	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 51' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:03.766929	\N
788	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:15.308804	\N
789	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:15.324049	\N
790	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:15.337326	\N
791	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:15.350306	\N
792	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:15.36319	\N
793	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 19:57:15.377913	\N
794	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:03:07.541424	\N
795	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:03:07.563783	\N
796	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:03:07.579091	\N
797	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:03:07.598053	\N
798	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:03:07.623601	\N
799	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 71' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:03:07.644379	\N
800	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:25.484826	\N
801	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:25.503418	\N
802	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:25.515408	\N
803	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:25.530441	\N
804	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:25.550774	\N
805	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:25.567454	\N
806	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:36.965876	\N
807	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:36.97837	\N
808	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:36.990695	\N
809	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:37.003221	\N
810	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:37.020633	\N
811	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:37.034477	\N
812	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:40.525034	\N
813	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:40.538504	\N
814	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:40.550958	\N
815	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:40.56785	\N
816	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:40.58061	\N
817	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:04:40.621724	\N
818	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:06:47.418527	\N
819	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:06:47.435614	\N
820	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:06:47.450039	\N
821	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:06:47.462448	\N
822	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:06:47.476221	\N
823	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:06:47.491919	\N
824	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:04.200653	\N
825	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:04.226025	\N
826	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:04.24576	\N
827	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:04.265058	\N
828	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:04.287351	\N
829	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:04.304698	\N
830	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:47.488442	\N
832	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:47.515483	\N
834	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:47.546392	\N
837	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:31.51378	\N
839	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:31.53851	\N
841	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:31.560655	\N
843	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:59.587491	\N
845	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:59.614149	\N
847	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:59.639805	\N
849	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:03.151356	\N
851	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:03.182673	\N
853	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:03.208365	\N
854	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:08.465269	\N
856	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:08.544445	\N
858	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:08.571051	\N
860	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:16.823426	\N
862	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:16.852098	\N
864	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:16.87663	\N
867	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:31.255089	\N
869	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:31.284681	\N
871	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:31.321223	\N
873	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:43.48964	\N
875	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:43.539884	\N
877	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:43.565533	\N
879	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:52.187286	\N
881	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:52.218897	\N
883	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:52.242287	\N
831	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:47.503263	\N
833	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:47.531944	\N
835	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:12:47.563345	\N
836	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:31.497638	\N
838	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:31.525663	\N
840	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:31.549666	\N
842	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:59.572348	\N
844	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:59.601233	\N
846	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:13:59.627164	\N
848	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:03.136032	\N
850	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:03.166509	\N
852	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:03.195958	\N
855	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:08.478494	\N
857	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:08.559829	\N
859	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:08.583158	\N
861	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:16.837106	\N
863	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:16.864921	\N
865	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 69' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:14:16.886953	\N
866	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:31.232725	\N
868	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:31.268253	\N
870	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:31.306765	\N
872	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:43.470387	\N
874	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:43.523188	\N
876	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:43.552987	\N
878	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:52.170645	\N
880	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:52.202305	\N
882	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:15:52.230955	\N
884	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:24:50.117323	\N
885	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:24:50.142601	\N
886	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:24:50.185241	\N
887	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:24:50.220532	\N
888	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:24:50.235624	\N
889	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:24:50.249145	\N
890	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:25:23.439444	\N
892	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:25:23.464382	\N
894	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:25:23.487829	\N
891	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:25:23.453146	\N
893	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:25:23.47694	\N
895	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:25:23.497657	\N
896	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:09.225601	\N
897	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:09.250795	\N
898	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:09.264706	\N
899	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:09.277236	\N
900	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:09.289204	\N
901	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:09.301396	\N
902	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:31.899954	\N
903	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:31.918242	\N
904	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:31.936342	\N
905	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:31.956417	\N
906	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:31.977227	\N
907	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:26:32.000524	\N
908	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:10.769591	\N
909	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:10.787166	\N
910	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:10.802861	\N
911	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:10.83206	\N
912	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:10.845821	\N
913	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:10.858424	\N
914	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:35.219883	\N
915	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:35.237262	\N
916	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:35.252424	\N
917	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:35.27001	\N
918	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:35.290346	\N
919	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:27:35.315077	\N
920	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:36:49.17549	\N
921	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:36:49.199066	\N
922	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:36:49.212094	\N
923	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:36:49.228936	\N
924	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:36:49.244413	\N
925	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:36:49.260976	\N
926	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:38:00.397577	\N
927	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:38:00.416921	\N
928	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:38:00.431367	\N
929	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:38:00.444591	\N
930	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:38:00.457222	\N
931	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 20:38:00.47001	\N
932	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:05.727653	\N
933	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:05.819099	\N
934	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:05.837142	\N
935	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:05.855065	\N
936	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:05.868302	\N
937	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 3' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:05.881888	\N
938	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:52.865585	\N
939	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:52.898227	\N
940	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:52.919041	\N
941	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:52.936842	\N
942	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:52.951442	\N
943	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 4' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:13:52.967297	\N
944	1	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:14:15.947666	\N
945	2	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:14:15.963375	\N
946	1061	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:14:15.988072	\N
947	1067	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:14:16.007053	\N
948	1070	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:14:16.02199	\N
949	1071	step_updated	تم تعديل خطوة	تم تعديل تفاصيل الخطوة 'خطوة 2' في المهمة 'These utilities only support the browser keywords auto, thin, and none.\n\n'	1	\N	\N	2026-07-14 21:14:16.036088	\N
950	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	11	{"automation": true, "template_id": 154}	\N	2026-07-15 16:28:59.210499	\N
951	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	11	{"automation": true, "template_id": 154}	\N	2026-07-15 16:28:59.210499	\N
952	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	11	{"automation": true, "template_id": 154}	\N	2026-07-15 16:28:59.210499	\N
953	1061	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	12	{"automation": true, "template_id": 154}	\N	2026-07-15 19:28:57.688626	\N
954	2	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	12	{"automation": true, "template_id": 154}	\N	2026-07-15 19:28:57.688626	\N
955	1	task_assigned	📅 مهمة دورية تلقائية	قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\n\n). يرجى المتابعة والبدء في التنفيذ.	12	{"automation": true, "template_id": 154}	\N	2026-07-15 19:28:57.688626	\N
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
2	154	failed	\N	(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) <class 'asyncpg.exceptions.UniqueViolationError'>: duplicate key value violates unique constraint "notifications_pkey"\nDETAIL:  Key (id)=(86) already exists.\n[SQL: INSERT INTO notifications (user_id, type, title, body, related_task_id, extra_data, read_at, deleted_at) VALUES ($1::INTEGER, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::INTEGER, $6::VARCHAR, $7::TIMESTAMP WITHOUT TIME ZONE, $8::TIMESTAMP WITHOUT TIME ZONE) RETURNING notifications.id, notifications.created_at]\n[parameters: (1, 'task_assigned', '📅 مهمة دورية تلقائية', 'قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\\n\\n). يرجى المتابعة والبدء في التنفيذ.', 2, '{"automation": true, "template_id": 154}', None, None)]\n(Background on this error at: https://sqlalche.me/e/20/gkpj)	2026-07-08 17:14:00.651598
3	154	failed	\N	(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) <class 'asyncpg.exceptions.UniqueViolationError'>: duplicate key value violates unique constraint "notifications_pkey"\nDETAIL:  Key (id)=(92) already exists.\n[SQL: INSERT INTO notifications (user_id, type, title, body, related_task_id, extra_data, read_at, deleted_at) VALUES ($1::INTEGER, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::INTEGER, $6::VARCHAR, $7::TIMESTAMP WITHOUT TIME ZONE, $8::TIMESTAMP WITHOUT TIME ZONE) RETURNING notifications.id, notifications.created_at]\n[parameters: (1061, 'task_assigned', '📅 مهمة دورية تلقائية', 'قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\\n\\n). يرجى المتابعة والبدء في التنفيذ.', 3, '{"automation": true, "template_id": 154}', None, None)]\n(Background on this error at: https://sqlalche.me/e/20/gkpj)	2026-07-08 20:13:55.104391
4	154	failed	\N	(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) <class 'asyncpg.exceptions.UniqueViolationError'>: duplicate key value violates unique constraint "notifications_pkey"\nDETAIL:  Key (id)=(99) already exists.\n[SQL: INSERT INTO notifications (user_id, type, title, body, related_task_id, extra_data, read_at, deleted_at) VALUES ($1::INTEGER, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::INTEGER, $6::VARCHAR, $7::TIMESTAMP WITHOUT TIME ZONE, $8::TIMESTAMP WITHOUT TIME ZONE) RETURNING notifications.id, notifications.created_at]\n[parameters: (1061, 'task_assigned', '📅 مهمة دورية تلقائية', 'قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\\n\\n). يرجى المتابعة والبدء في التنفيذ.', 4, '{"automation": true, "template_id": 154}', None, None)]\n(Background on this error at: https://sqlalche.me/e/20/gkpj)	2026-07-12 16:16:56.796125
5	154	failed	\N	(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) <class 'asyncpg.exceptions.UniqueViolationError'>: duplicate key value violates unique constraint "notifications_pkey"\nDETAIL:  Key (id)=(101) already exists.\n[SQL: INSERT INTO notifications (user_id, type, title, body, related_task_id, extra_data, read_at, deleted_at) VALUES ($1::INTEGER, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::INTEGER, $6::VARCHAR, $7::TIMESTAMP WITHOUT TIME ZONE, $8::TIMESTAMP WITHOUT TIME ZONE) RETURNING notifications.id, notifications.created_at]\n[parameters: (1061, 'task_assigned', '📅 مهمة دورية تلقائية', 'قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\\n\\n). يرجى المتابعة والبدء في التنفيذ.', 5, '{"automation": true, "template_id": 154}', None, None)]\n(Background on this error at: https://sqlalche.me/e/20/gkpj)	2026-07-12 18:17:54.605681
6	154	failed	\N	(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) <class 'asyncpg.exceptions.UniqueViolationError'>: duplicate key value violates unique constraint "notifications_pkey"\nDETAIL:  Key (id)=(129) already exists.\n[SQL: INSERT INTO notifications (user_id, type, title, body, related_task_id, extra_data, read_at, deleted_at) VALUES ($1::INTEGER, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::INTEGER, $6::VARCHAR, $7::TIMESTAMP WITHOUT TIME ZONE, $8::TIMESTAMP WITHOUT TIME ZONE) RETURNING notifications.id, notifications.created_at]\n[parameters: (1061, 'task_assigned', '📅 مهمة دورية تلقائية', 'قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\\n\\n). يرجى المتابعة والبدء في التنفيذ.', 6, '{"automation": true, "template_id": 154}', None, None)]\n(Background on this error at: https://sqlalche.me/e/20/gkpj)	2026-07-13 12:28:05.171478
7	154	failed	\N	(sqlalchemy.dialects.postgresql.asyncpg.IntegrityError) <class 'asyncpg.exceptions.UniqueViolationError'>: duplicate key value violates unique constraint "notifications_pkey"\nDETAIL:  Key (id)=(171) already exists.\n[SQL: INSERT INTO notifications (user_id, type, title, body, related_task_id, extra_data, read_at, deleted_at) VALUES ($1::INTEGER, $2::VARCHAR, $3::VARCHAR, $4::VARCHAR, $5::INTEGER, $6::VARCHAR, $7::TIMESTAMP WITHOUT TIME ZONE, $8::TIMESTAMP WITHOUT TIME ZONE) RETURNING notifications.id, notifications.created_at]\n[parameters: (1061, 'task_assigned', '📅 مهمة دورية تلقائية', 'قام النظام بإصدار مهمة دورية آلياً لقسمكم بعنوان: (These utilities only support the browser keywords auto, thin, and none.\\n\\n). يرجى المتابعة والبدء في التنفيذ.', 7, '{"automation": true, "template_id": 154}', None, None)]\n(Background on this error at: https://sqlalche.me/e/20/gkpj)	2026-07-13 15:15:51.702115
8	154	success	8	\N	2026-07-14 16:54:21.722659
9	154	success	9	\N	2026-07-14 17:49:01.431472
10	154	success	10	\N	2026-07-14 19:31:14.813108
11	154	success	11	\N	2026-07-15 16:28:58.514313
12	154	success	12	\N	2026-07-15 19:28:57.296161
13	154	success	13	\N	2026-07-19 15:19:22.724027
14	154	success	14	\N	2026-07-20 14:56:33.609567
15	154	success	15	\N	2026-07-20 17:10:50.206623
16	154	success	16	\N	2026-07-21 13:53:21.972718
17	154	success	17	\N	2026-07-22 00:16:12.240382
\.


--
-- Data for Name: recurring_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_tasks (id, title, description, department_id, created_by, priority, recurrence_pattern, interval_value, day_of_week, day_of_month, next_run_date, is_active, run_time, created_at, updated_at, deleted_at) FROM stdin;
154	مهمة مكررة	sdf	109	1	MEDIUM	DAILY	1	\N	\N	2026-06-26	t	08:00:00	2026-06-28 22:40:16.678744	2026-07-22 00:16:12.240382	\N
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_assignments (id, task_id, user_id, assignment_type, assigned_by, assigned_at, deleted_at) FROM stdin;
4	1	1070	ASSIGNEE	1	2026-06-24 00:30:07.761524	\N
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
9	1	1	favorite_added	\N	\N	قام System Developer بتحديث مفضلته	2026-07-14 18:08:49.640886	\N
10	1	1	time_log_started	\N	\N	بدء العمل على المهمة بواسطة System Developer	2026-07-14 18:33:34.560432	\N
11	1	1	time_log_stopped	\N	\N	إيقاف العمل على المهمة بواسطة System Developer، المدة: 0:00:08.749608	2026-07-14 18:33:43.425661	\N
12	1	1	transferred	مجلس ادارة الشركة	قطاع التخطيط	طلب تحويل بواسطة System Developer	2026-07-14 18:34:47.86267	\N
\.


--
-- Data for Name: task_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_shares (id, task_id, shared_with_user_id, permission, shared_by, requires_approval, approval_status, approved_by, expires_at, created_at) FROM stdin;
3	1	1067	EDIT	1	f	approved	\N	2026-07-14 19:40:50.829	2026-06-24 20:34:44.885615
6	1	1062	VIEW	1	f	approved	\N	2026-07-14 19:40:55.602	2026-06-24 20:56:44.931838
\.


--
-- Data for Name: task_step_dependencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_step_dependencies (id, parent_step_id, child_step_id) FROM stdin;
49	4	2
\.


--
-- Data for Name: task_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_steps (id, task_id, title, description, step_order, is_parallel, status, assigned_department_id, assigned_user_id, started_at, completed_at, completed_by, created_at, updated_at, parent_id, deleted_at) FROM stdin;
12	1	خطوة 12	وصف خطوة 12	9	t	pending	104	\N	\N	\N	\N	2026-06-29 23:05:24.863568	2026-07-13 20:25:31.581637	\N	\N
14	1	خطوة 14	وصف خطوة 14	10	f	pending	104	\N	\N	\N	\N	2026-06-29 23:55:08.724349	2026-07-13 20:25:14.530688	\N	\N
15	1	خطوة 15	وصف خطوة 15	11	t	pending	104	\N	\N	\N	\N	2026-07-05 18:59:29.521681	2026-07-13 20:25:31.581637	\N	\N
16	1	خطوة 16	وصف خطوة 16	12	t	pending	\N	1	\N	\N	\N	2026-07-05 18:59:57.173042	2026-07-13 20:25:14.530688	\N	\N
33	1	خطوة 33	وصف خطوة 33	25	t	pending	109	\N	\N	\N	\N	2026-07-12 19:20:07.920785	2026-07-13 20:24:25.42743	\N	\N
48	1	خطوة 48	وصف خطوة 48	27	t	pending	\N	1061	\N	\N	\N	2026-07-13 16:14:33.299375	2026-07-13 20:24:25.42743	\N	\N
11	1	خطوة 11	وصف خطوة 11	8	t	pending	104	\N	2026-06-29 22:56:45.817	\N	\N	2026-06-29 20:56:42.82466	2026-07-13 20:25:31.581637	\N	\N
10	1	خطوة 10	وصف خطوة 10	7	t	pending	\N	1	\N	\N	\N	2026-06-28 18:44:44.440095	2026-07-13 20:25:35.282833	\N	\N
7	1	خطوة 7	وصف خطوة 7	6	f	pending	104	\N	\N	\N	\N	2026-06-28 14:52:09.264074	2026-07-13 20:25:35.282833	\N	\N
3	1	خطوة 3	وصف خطوة 3	2	t	pending	104	\N	\N	\N	\N	2026-07-05 18:40:16.405443	2026-07-13 20:24:05.994456	\N	\N
69	1	خطوة 69	وصف خطوة 69	30	t	in_progress	109	1061	\N	\N	\N	2026-07-13 16:58:32.406375	2026-07-14 20:14:16.644407	2	\N
4	1	خطوة 4	وصف خطوة 4	3	f	pending	104	\N	2026-07-05 21:01:51.498	\N	\N	2026-07-05 18:49:54.983608	2026-07-13 20:24:16.130277	\N	\N
5	1	خطوة 5	وصف خطوة 5	4	f	pending	104	\N	2026-06-28 16:00:34.346	\N	\N	2026-06-28 14:45:00.294494	2026-07-13 20:24:16.130277	\N	\N
6	1	خطوة 6	وصف خطوة 6	5	f	pending	104	\N	\N	\N	\N	2026-06-28 14:50:38.047557	2026-07-13 20:24:16.130277	\N	\N
50	1	خطوة 50	وصف خطوة 50	29	t	pending	\N	1061	\N	\N	\N	2026-07-13 16:15:31.143163	2026-07-13 20:47:53.596322	33	\N
49	1	خطوة 49	وصف خطوة 49	28	t	pending	\N	1061	\N	\N	\N	2026-07-13 16:15:23.90298	2026-07-13 20:48:08.538384	33	\N
2	1	خطوة 2	وصف خطوة 2	1	t	pending	104	\N	\N	\N	\N	2026-06-28 14:40:33.88163	2026-07-14 21:14:15.674695	\N	\N
47	1	خطوة 47	وصف خطوة 47	26	t	pending	\N	1071	\N	\N	\N	2026-07-13 16:11:58.890634	2026-07-13 20:24:25.42743	\N	\N
17	1	خطوة 17	وصف خطوة 17	13	t	pending	106	\N	\N	\N	\N	2026-07-08 18:22:41.177851	2026-07-13 20:24:25.42743	\N	\N
19	1	خطوة 19	وصف خطوة 19	15	t	pending	104	\N	\N	\N	\N	2026-07-08 18:25:13.68407	2026-07-13 20:24:25.42743	\N	\N
20	1	خطوة 20	وصف خطوة 20	16	f	pending	104	\N	\N	\N	\N	2026-07-08 18:25:59.593799	2026-07-13 20:24:25.42743	\N	\N
23	1	خطوة 23	وصف خطوة 23	17	f	pending	\N	1	\N	\N	\N	2026-07-08 18:33:51.527351	2026-07-13 20:24:25.42743	\N	\N
27	1	خطوة 27	وصف خطوة 27	18	t	pending	109	\N	\N	\N	\N	2026-07-12 19:07:09.398648	2026-07-13 20:24:25.42743	\N	\N
28	1	خطوة 28	وصف خطوة 28	20	t	pending	109	\N	\N	\N	\N	2026-07-12 19:07:18.201789	2026-07-13 20:24:25.42743	\N	\N
29	1	خطوة 29	وصف خطوة 29	21	t	pending	109	\N	\N	\N	\N	2026-07-12 19:10:37.907599	2026-07-13 20:24:25.42743	\N	\N
30	1	خطوة 30	وصف خطوة 30	22	t	pending	109	\N	\N	\N	\N	2026-07-12 19:12:01.021052	2026-07-13 20:24:25.42743	\N	\N
31	1	خطوة 31	وصف خطوة 31	23	t	pending	109	\N	\N	\N	\N	2026-07-12 19:16:07.528365	2026-07-13 20:24:25.42743	\N	\N
32	1	خطوة 32	وصف خطوة 32	24	t	pending	109	\N	\N	\N	\N	2026-07-12 19:18:43.573967	2026-07-13 20:24:25.42743	\N	\N
18	1	خطوة 18	وصف خطوة 18	14	t	pending	104	\N	\N	\N	\N	2026-07-08 18:24:21.720602	2026-07-13 20:24:25.42743	\N	\N
\.


--
-- Data for Name: task_time_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_time_logs (id, task_id, user_id, started_at, stopped_at, note) FROM stdin;
9	1018	1	2026-06-24 20:10:21.251489	2026-06-24 20:10:36.772901	\N
10	1018	1	2026-06-28 08:38:05.138472	2026-06-28 08:38:07.321274	\N
1	1	1	2026-07-14 18:33:34.76346	2026-07-14 18:33:43.513068	\N
\.


--
-- Data for Name: task_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_transfers (id, task_id, from_department_id, to_department_id, from_user_id, to_user_id, status, rejection_reason, transfer_note, created_at, resolved_at) FROM stdin;
2	1016	107	104	1067	1	PENDING	\N	\N	2026-06-23 19:50:21.318385	\N
3	1018	104	105	1	1067	PENDING	\N	\N	2026-06-24 20:32:53.102343	\N
1	1	104	106	1	1071	PENDING	\N	\N	2026-07-14 18:34:47.86267	\N
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
8	اول مهمة	These utilities only support the browser keywords auto, thin, and none.	EM1653	2026-07-14 00:00:00	2026-07-30 00:00:00	2026-07-29 20:17:00	\N	f	t	MEDIUM	0	IN_PROGRESS	1	104	\N	\N	\N	2026-07-14 16:54:21.722659	2026-07-14 17:17:37.85586	\N
1	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	FILE-04632	2026-07-14 00:00:00	2026-07-31 00:00:00	2026-07-30 20:18:00	\N	t	t	MEDIUM	0	IN_PROGRESS	1	104	2026-07-14 18:35:52.294827	1	REJECTED	2026-07-02 11:57:31.226381	2026-07-14 18:35:57.118616	\N
9	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-14 17:49:01.431472	2026-07-14 17:49:01.775817	\N
10	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-14 19:31:14.813108	2026-07-14 19:31:20.445403	\N
11	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-15 16:28:58.514313	2026-07-15 16:28:59.210499	\N
12	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-15 19:28:57.296161	2026-07-15 19:28:57.688626	\N
13	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-19 15:19:22.724027	2026-07-19 15:19:23.994529	\N
14	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-20 14:56:33.609567	2026-07-20 14:56:34.142073	\N
15	These utilities only support the browser keywords auto, thin, and none.\n\n	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	104	\N	\N	\N	2026-07-20 17:10:50.206623	2026-07-20 17:10:51.258586	\N
16	مهمة مكررة	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	109	\N	\N	\N	2026-07-21 13:53:21.972718	2026-07-21 13:53:22.3106	\N
17	مهمة مكررة	sdf	\N	\N	\N	\N	\N	f	t	MEDIUM	0	NOT_STARTED	1	109	\N	\N	\N	2026-07-22 00:16:12.240382	2026-07-22 00:16:12.561075	\N
\.


--
-- Data for Name: user_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_contacts (id, user_id, phone_number, whatsapp_number, telegram_username, extension_number, is_private, created_at, updated_at) FROM stdin;
1004	2	01090018255	01090018251	sdsd	110	f	2026-06-23 01:50:47.911512	2026-06-23 01:50:47.911512
1002	1	01090018329	01090018329	hjg	67678	t	2026-06-10 17:23:43.889257	2026-07-19 15:29:42.470145
1	1060	\N	\N	\N	\N	f	2026-07-20 18:21:16.534151	2026-07-20 18:21:16.534151
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
1	1	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-19 15:29:42.498135
2	1	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-19 15:29:52.588833
34	2	user_edited	null	{"is_active": false, "updated_by": 1}	2026-07-20 17:14:41.61374
35	2	user_edited	null	{"is_active": true, "updated_by": 1}	2026-07-20 17:14:43.98553
36	2	user_edited	null	{"employee_number": "00000010", "full_name": "\\u062e\\u0627\\u0644\\u062f \\u0627\\u0644\\u0639\\u0645\\u0631\\u0649", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0645\\u062c\\u0644\\u0633 \\u0627\\u0644\\u0627\\u062f\\u0627\\u0631\\u0629", "email": "chairman.sinaiwater@outlook.com", "work_location_id": 13, "manager_id": null, "job_level_id": 14, "department_id": 104, "global_role": "user", "can_transfer_external": true, "is_active": true, "avatar_url": "full_name", "password_hash": "$2b$12$jc0xwHA1OYSA5qj3lRA.WexVVMowQuqpjny7YEJ.4IKWSOk0ypa2G", "updated_by": 1}	2026-07-20 17:15:03.462155
37	2	user_edited	null	{"employee_number": "00000010", "full_name": "\\u062e\\u0627\\u0644\\u062f \\u0627\\u0644\\u0639\\u0645\\u0631\\u0649", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0645\\u062c\\u0644\\u0633 \\u0627\\u0644\\u0627\\u062f\\u0627\\u0631\\u0629", "email": "chairman.sinaiwater@outlook.com", "work_location_id": 13, "manager_id": null, "job_level_id": 14, "department_id": 104, "global_role": "user", "can_transfer_external": true, "is_active": true, "avatar_url": "full_name", "updated_by": 1}	2026-07-20 17:23:44.49358
38	2	user_edited	null	{"employee_number": "00000010", "full_name": "\\u062e\\u0627\\u0644\\u062f \\u0627\\u0644\\u0639\\u0645\\u0631\\u0649", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0645\\u062c\\u0644\\u0633 \\u0627\\u0644\\u0627\\u062f\\u0627\\u0631\\u0629", "email": "chairman.sinaiwater@outlook.com", "work_location_id": 13, "manager_id": null, "job_level_id": 14, "department_id": 104, "global_role": "user", "can_transfer_external": true, "is_active": true, "avatar_url": "full_name", "updated_by": 1}	2026-07-20 17:24:03.273578
39	2	user_edited	null	{"employee_number": "00000010", "full_name": "\\u062e\\u0627\\u0644\\u062f \\u0627\\u0644\\u0639\\u0645\\u0631\\u0649", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0645\\u062c\\u0644\\u0633 \\u0627\\u0644\\u0627\\u062f\\u0627\\u0631\\u0629", "email": "chairman.sinaiwater@outlook.com", "work_location_id": 13, "manager_id": null, "job_level_id": 14, "department_id": 104, "global_role": "user", "can_transfer_external": true, "is_active": true, "avatar_url": "full_name", "updated_by": 1}	2026-07-20 17:24:21.90091
40	2	user_edited	null	{"employee_number": "00000010", "full_name": "\\u062e\\u0627\\u0644\\u062f \\u0627\\u0644\\u0639\\u0645\\u0631\\u0649", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0645\\u062c\\u0644\\u0633 \\u0627\\u0644\\u0627\\u062f\\u0627\\u0631\\u0629", "email": "chairman.sinaiwater@outlook.com", "work_location_id": 13, "manager_id": null, "job_level_id": 14, "department_id": 104, "global_role": "user", "can_transfer_external": true, "is_active": true, "avatar_url": "", "updated_by": 1}	2026-07-20 17:26:10.140225
41	2	user_edited	null	{"employee_number": "00000010", "full_name": "\\u062e\\u0627\\u0644\\u062f \\u0627\\u0644\\u0639\\u0645\\u0631\\u0649", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0645\\u062c\\u0644\\u0633 \\u0627\\u0644\\u0627\\u062f\\u0627\\u0631\\u0629", "email": "chairman.sinaiwater@outlook.com", "work_location_id": 13, "manager_id": 2, "job_level_id": 14, "department_id": 104, "global_role": "user", "can_transfer_external": true, "is_active": true, "avatar_url": "", "updated_by": 1}	2026-07-20 17:27:05.561845
42	1	remove_manager	null	{"department_id": 104, "user_id": 1067}	2026-07-20 17:29:04.969277
43	2	user_edited	null	{"is_active": false, "updated_by": 1}	2026-07-20 18:14:26.27232
44	2	user_edited	null	{"is_active": true, "updated_by": 1}	2026-07-20 18:14:38.471083
45	1067	user_edited	null	{"is_active": false, "updated_by": 1}	2026-07-20 18:14:43.442293
46	1067	user_edited	null	{"is_active": true, "updated_by": 1}	2026-07-20 18:15:06.399363
47	1067	user_edited	null	{"is_active": false, "updated_by": 1}	2026-07-20 18:15:13.340326
48	1067	user_edited	null	{"is_active": true, "updated_by": 1}	2026-07-20 18:19:30.471891
49	1060	user_edited	null	{"full_name": "Amer Hendy", "email": "amerhendyali@gmail.com", "password_hash": "$2b$12$lmO5ra/c05cFYyntnnLEbu.63mcjuVIp9Uhq.HUIPVVIKpmOJhaGO", "updated_by": 1060}	2026-07-20 18:20:23.919328
50	1060	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-20 18:21:16.561485
51	1060	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": false, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-20 18:21:27.878422
52	1060	user changed their notification settings	{"browser": true, "email": false, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-20 18:21:32.890015
53	1060	user changed their notification settings	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": false, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-20 18:21:39.187783
55	1	assign_manager	null	{"department_id": 106, "user_id": 1071, "is_primary": true}	2026-07-20 18:23:59.462083
54	1060	user changed their notification settings	{"browser": true, "email": false, "whatsapp": true, "telegram": true, "sms": true, "google": true}	{"browser": true, "email": true, "whatsapp": true, "telegram": true, "sms": true, "google": true}	2026-07-20 18:21:45.762215
56	1	user_created	null	{"employee_number": "000258", "full_name": "\\u0646\\u0647\\u0644\\u0629 \\u0633\\u064a\\u062f", "job_title": "\\u0631\\u0626\\u064a\\u0633 \\u0642\\u0637\\u0627\\u0639 \\u0627\\u0644\\u0645\\u0634\\u0631\\u0648\\u0639\\u0627\\u062a", "email": "nahla@gmail.com", "work_location_id": 13, "job_level_id": 19, "department_id": 109, "global_role": "user", "can_transfer_external": true, "created_by": 1, "user_id": 1072}	2026-07-20 18:31:18.738544
57	1	assign_manager	null	{"department_id": 109, "user_id": 1072, "is_primary": true}	2026-07-20 18:31:38.769882
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_number, full_name, job_title, work_location_id, email, password_hash, google_id, job_level_id, department_id, global_role, can_transfer_external, is_active, avatar_url, last_login, created_at, updated_at) FROM stdin;
1069	000009	medhat	مدير مكتب فنى للشئون قانونية	13	emai2l@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	22	132	USER	f	t	\N	\N	2026-06-23 17:12:41.415383	2026-06-23 17:12:41.415383
1062	000007	ابراهيم عيد	amer.hendy@yahoo.com	13	ebrahimeid@gmail.com	$2b$12$z8Ot90eIoruZ/QKfQbJo8eADvxhUWatFQQUUHv4pfVXXxPY0N/jei	\N	22	105	USER	t	t	\N	2026-06-23 16:14:18.545151	2026-06-16 19:21:47.307083	2026-06-23 16:14:18.277359
1070	000010	aburaia	lسكرتير	13	ema3il@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	29	129	USER	f	t	\N	2026-06-28 07:16:25.022432	2026-06-23 17:12:41.419671	2026-06-28 07:16:24.73676
1061	100000	Amer Hendy	مدير عام النظام	10	amer.hendy@yahoo.com	$2b$12$c4i9DuQdcSN0sTfK6VVlXOVgY6dXALgGSyr4SQeNMnOZo0c2Vh5AG	\N	16	104	GLOBAL_ADMIN	t	t		2026-07-01 21:26:57.167381	2026-06-10 17:25:30.65198	2026-07-01 21:26:56.504245
1067	000008	tarsk agrody	مدير عام ش ق	13	emai1l@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	20	105	USER	f	t	\N	2026-07-14 21:16:37.07178	2026-06-23 17:12:28.039991	2026-07-20 18:19:30.400771
1060	1040	Amer Hendy	chairman office manager	1	amerhendyali@gmail.com	$2b$12$lmO5ra/c05cFYyntnnLEbu.63mcjuVIp9Uhq.HUIPVVIKpmOJhaGO	\N	20	105	USER	f	t		2026-07-20 18:08:08.641301	2026-06-10 16:52:18.151675	2026-07-20 18:20:23.528392
1	0000001	System Developer	System Developer	13	global.admin@company.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	17	104	GLOBAL_ADMIN	f	t	https://randomuser.me/api/portraits/men/0.jpg	2026-07-22 00:17:05.310791	2026-06-02 00:25:31.840789	2026-07-22 00:17:05.072257
1071	0000011	mido	رئيس قطاع	13	ema4il@mail.com	$2b$12$nglcaVjYXzB2zK.FfifAgOC.SpOHVvDLAg4Mo6vy2Add3tKHXgaR2	\N	19	106	USER	f	t	\N	2026-07-14 21:17:54.052301	2026-06-23 17:12:41.423605	2026-07-14 21:17:53.796469
2	00000010	خالد العمرى	رئيس مجلس الادارة	13	chairman.sinaiwater@outlook.com	$2b$12$jc0xwHA1OYSA5qj3lRA.WexVVMowQuqpjny7YEJ.4IKWSOk0ypa2G	\N	14	104	USER	t	t		2026-07-20 14:58:41.02671	2026-07-13 19:09:19.136077	2026-07-20 18:14:38.426509
1072	000258	نهلة سيد	رئيس قطاع المشروعات	13	nahla@gmail.com	$2b$12$ZqGghuvEcsVBbkOhjytoEOYT9HXmFXMW4yMDKa0PYsssXRlgsxroW	\N	19	109	USER	t	t	\N	\N	2026-07-20 18:31:18.336354	2026-07-20 18:31:18.336354
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

SELECT pg_catalog.setval('public.department_managers_id_seq', 5, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 10, true);


--
-- Name: job_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_levels_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 1, true);


--
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 966, true);


--
-- Name: recurring_task_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_task_logs_id_seq', 17, true);


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

SELECT pg_catalog.setval('public.task_logs_id_seq', 45, true);


--
-- Name: task_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_shares_id_seq', 1, false);


--
-- Name: task_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_steps_id_seq', 71, true);


--
-- Name: task_time_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_time_logs_id_seq', 1, true);


--
-- Name: task_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_transfers_id_seq', 33, true);


--
-- Name: task_workflow_step_dependencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_workflow_step_dependencies_id_seq', 49, true);


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

SELECT pg_catalog.setval('public.tasks_id_seq', 17, true);


--
-- Name: user_contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_contacts_id_seq', 1, true);


--
-- Name: user_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_logs_id_seq', 57, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1072, true);


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
-- Name: task_step_dependencies task_workflow_step_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_step_dependencies
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

CREATE INDEX ix_task_workflow_step_dependencies_id ON public.task_step_dependencies USING btree (id);


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
-- Name: locations fk_location_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT fk_location_parent FOREIGN KEY (parent_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: task_logs fk_task_logs_recurring_task; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT fk_task_logs_recurring_task FOREIGN KEY (recurring_task_id) REFERENCES public.recurring_tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: task_steps task_steps_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_steps
    ADD CONSTRAINT task_steps_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.task_steps(id) ON DELETE CASCADE;


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
-- Name: task_step_dependencies task_workflow_step_dependencies_task_steps_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_step_dependencies
    ADD CONSTRAINT task_workflow_step_dependencies_task_steps_fk FOREIGN KEY (parent_step_id) REFERENCES public.task_steps(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_step_dependencies task_workflow_step_dependencies_task_steps_fk_1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_step_dependencies
    ADD CONSTRAINT task_workflow_step_dependencies_task_steps_fk_1 FOREIGN KEY (child_step_id) REFERENCES public.task_steps(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict nhlpsh3deDD3Zfg6nQ5Y1VSfgPrSMTnl497cJwdvAGfsIpE7e1YJEJsvr5oPjS3

