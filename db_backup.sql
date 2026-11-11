--
-- PostgreSQL database cluster dump
--

\restrict rqVMxTypS9eOvnLO3AsBekEVFoo8Ta0MURmQoWIotwUtqewkFWo9q5dy4UdbsbA

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:LJeZoqLZQ5JtNpb8aQXYbg==$fS4xTpRZ+cH9bS2U7xMmiG0WhKBxi3lFb29vRsvxh1w=:6QY8w+BfoCOJZKooglCDq6dmQk8cWX18n9+Nn9xM/gU=';

--
-- User Configurations
--








\unrestrict rqVMxTypS9eOvnLO3AsBekEVFoo8Ta0MURmQoWIotwUtqewkFWo9q5dy4UdbsbA

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict gKbDAwf2pop9K2MCqM0XM3k6ZmyMt2UJbuzOXAAWxvGjuKdRVHBAeDd6cIEIo5x

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- PostgreSQL database dump complete
--

\unrestrict gKbDAwf2pop9K2MCqM0XM3k6ZmyMt2UJbuzOXAAWxvGjuKdRVHBAeDd6cIEIo5x

--
-- Database "corporate_tasks" dump
--

--
-- PostgreSQL database dump
--

\restrict S0Odqj7AGwT7E9jYx1kt8l8M9NIvC4devKV1UdXjTZ0S1QdIPaTGtLdtZUkZzbh

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- Name: corporate_tasks; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE corporate_tasks WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE corporate_tasks OWNER TO postgres;

\unrestrict S0Odqj7AGwT7E9jYx1kt8l8M9NIvC4devKV1UdXjTZ0S1QdIPaTGtLdtZUkZzbh
\connect corporate_tasks
\restrict S0Odqj7AGwT7E9jYx1kt8l8M9NIvC4devKV1UdXjTZ0S1QdIPaTGtLdtZUkZzbh

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
    start_date date NOT NULL,
    end_date date,
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
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    parent_department_id integer,
    job_level_id integer,
    is_active boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    location_id integer
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
    created_at timestamp without time zone DEFAULT now() NOT NULL
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
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_assignments (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    assignment_type public.assignmenttype NOT NULL,
    assigned_by integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
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
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
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
    step_order integer NOT NULL,
    description text NOT NULL,
    is_completed boolean NOT NULL,
    completed_at timestamp without time zone,
    completed_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
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
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_number character varying(100),
    start_date date,
    due_date date,
    reminder_datetime timestamp without time zone,
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL
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
    manager_id integer,
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
-- Name: delegations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations ALTER COLUMN id SET DEFAULT nextval('public.delegations_id_seq'::regclass);


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
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: task_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments ALTER COLUMN id SET DEFAULT nextval('public.task_assignments_id_seq'::regclass);


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
-- Name: task_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers ALTER COLUMN id SET DEFAULT nextval('public.task_transfers_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: delegations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delegations (id, delegator_id, delegate_id, permission_types, start_date, end_date, is_active, notes, created_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, parent_department_id, job_level_id, is_active, created_at, location_id) FROM stdin;
33	المالي	\N	16	t	2026-05-07 17:00:37.240291	5
34	الموارد البشرية	\N	16	t	2026-05-07 17:00:37.240291	5
35	التجاري	\N	16	t	2026-05-07 17:00:37.240291	5
36	المعمل	\N	16	t	2026-05-07 17:00:37.240291	5
39	الإدارات العامة	\N	16	t	2026-05-07 17:00:37.240291	5
40	الشئون القانونية	\N	16	t	2026-05-07 17:00:37.240291	5
41	شئون مالية	33	17	t	2026-05-07 17:00:37.240291	5
42	مراجعة	33	17	t	2026-05-07 17:00:37.240291	5
43	عقود	33	17	t	2026-05-07 17:00:37.240291	5
44	مشتريات	43	18	t	2026-05-07 17:00:37.240291	5
45	سكرتارية	43	18	t	2026-05-07 17:00:37.240291	5
46	التوظيف	34	17	t	2026-05-07 17:00:37.240291	5
47	التدريب	34	17	t	2026-05-07 17:00:37.240291	5
48	شئون العاملين	34	17	t	2026-05-07 17:00:37.240291	5
52	الادارة العامة لشئون مجلس الادارة	\N	16	t	2026-05-07 18:54:42.453857	5
53	إدارة شئون مجلس الادارة	52	18	t	2026-05-08 18:46:28.248625	5
37	شمال سيناء	\N	16	t	2026-05-07 17:00:37.240291	6
38	قطاع التشغيل والصيانة بجنوب سيناء	\N	16	t	2026-05-07 17:00:37.240291	7
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, task_id, created_at) FROM stdin;
\.


--
-- Data for Name: job_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_levels (id, level_number, title, description) FROM stdin;
16	2	رئيس قطاع	\N
17	3	مدير إدارة عامة	\N
18	4	مدير إدارة فرعية	\N
19	5	رئيس قسم	\N
21	7	موظف	\N
15	1	رئيس مجلس الإدارة والعضو المنتدب	
20	6	مدير منطقة	
23	8	مدير محطة	
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, name, is_active) FROM stdin;
5	المقر الرئيسي	t
6	فرع شمال سيناء	t
7	فرع جنوب سيناء	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, body, related_task_id, extra_data, read_at, created_at) FROM stdin;
1	1	urgent_approved	تم قبول طلب الاستعجال	تم قبول طلب استعجال المهمة "عنوان اول مهمة"	1	\N	2026-05-08 10:57:29.224379	2026-05-07 19:23:56.339792
2	7	share_granted	تمت مشاركة مهمة معك	تمت مشاركة مهمة "عنوان اول مهمة" معك بصلاحية view	1	\N	\N	2026-05-08 12:57:10.818841
3	4	external_share_requested	طلب مشاركة خارجية	مدير الشئون المالية يطلب مشاركة مهمة مع سارة أحمد - موظفة HR	1	\N	2026-05-08 17:36:29.201162	2026-05-08 13:03:03.691915
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_assignments (id, task_id, user_id, assignment_type, assigned_by, assigned_at) FROM stdin;
\.


--
-- Data for Name: task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_logs (id, task_id, user_id, action_type, old_value, new_value, extra_data, "timestamp") FROM stdin;
1	1	1	created	\N	عنوان اول مهمة	\N	2026-05-07 18:56:01.453382
2	1	1	edited	status:TaskStatus.NOT_STARTED	status:TaskStatus.IN_PROGRESS	\N	2026-05-07 19:19:01.855671
3	1	1	step_added	\N	خطوة اولى	\N	2026-05-07 19:19:19.59037
4	1	1	step_completed	\N	خطوة اولى	\N	2026-05-07 19:19:23.536964
5	1	1	urgent_requested	\N	طلب استعجال	\N	2026-05-07 19:23:25.860831
6	1	1	step_completed	\N	خطوة اولى	\N	2026-05-07 19:23:44.885485
7	1	1	urgent_approved	\N		\N	2026-05-07 19:23:56.339792
8	1	1	edited	status:TaskStatus.COMPLETED	status:TaskStatus.IN_PROGRESS	\N	2026-05-07 19:24:27.532072
9	1	1	edited	progress_percentage:100	progress_percentage:0	\N	2026-05-07 19:24:27.532072
10	1	1	edited	description:وصف	description:وصف اول مهمة	\N	2026-05-08 12:09:56.920305
11	1	1	edited	description:وصف اول مهمة	description:وصف 	\N	2026-05-08 12:10:14.215538
12	1	1	edited	department_id:52	department_id:35	\N	2026-05-08 12:17:15.109181
13	1	1	edited	department_id:35	department_id:41	\N	2026-05-08 12:17:28.939136
14	1	6	share_granted	\N	user:7 perm:view	\N	2026-05-08 12:57:10.818841
15	1	6	share_granted	\N	user:8 perm:admin	\N	2026-05-08 13:03:03.691915
\.


--
-- Data for Name: task_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_shares (id, task_id, shared_with_user_id, permission, shared_by, requires_approval, approval_status, approved_by, expires_at, created_at) FROM stdin;
1	1	7	VIEW	6	f	approved	\N	\N	2026-05-08 12:57:10.818841
2	1	8	ADMIN	6	t	pending	\N	\N	2026-05-08 13:03:03.691915
\.


--
-- Data for Name: task_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_steps (id, task_id, step_order, description, is_completed, completed_at, completed_by, created_at) FROM stdin;
1	1	0	خطوة اولى	t	2026-05-07 19:23:44.920021	1	2026-05-07 19:19:19.59037
\.


--
-- Data for Name: task_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_transfers (id, task_id, from_department_id, to_department_id, from_user_id, to_user_id, status, rejection_reason, transfer_note, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, file_number, start_date, due_date, reminder_datetime, is_urgent, is_important, priority, progress_percentage, status, created_by, department_id, urgency_requested_at, urgency_requested_by, urgency_request_status, created_at, updated_at) FROM stdin;
1	عنوان اول مهمة	وصف 	02002	2026-05-07	2026-05-08	2026-05-08 00:00:00	t	t	MEDIUM	0	IN_PROGRESS	1	41	2026-05-07 19:23:25.923315	1	APPROVED	2026-05-07 18:56:01.453382	2026-05-08 12:17:28.939136
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_number, full_name, job_title, work_location_id, email, password_hash, manager_id, job_level_id, department_id, global_role, can_transfer_external, is_active, avatar_url, last_login, created_at, updated_at) FROM stdin;
3	CEO001	رئيس مجلس الإدارة	Chairman	5	ceo@company.com	$2b$12$qHf9X/hEocKesfyFZVq0qOpP2cE96K5fhhIg4tveJMhbVMuoI3RAG	\N	15	39	USER	f	t	\N	\N	2026-05-07 17:00:37.240291	2026-05-07 17:00:37.240291
5	HR001	رئيس قطاع الموارد البشرية	Head of HR Sector	5	hr.head@company.com	$2b$12$wnf7aTYS8J1yEa3g2NnV4exh8kOhtSQVdgARrvwzvDBiQP2AIItEy	\N	16	34	USER	t	t	\N	\N	2026-05-07 17:00:37.240291	2026-05-07 17:00:37.240291
6	FIN002	مدير  المالي	Financial Affairs Manager	5	fin.mgr@company.com	$2b$12$JDn5xj1UZmd7HurjVH8m2eLj30Mpq0ivt7VuVuGsGl5FTsmEq.8rS	4	16	41	USER	f	t	\N	2026-05-08 13:04:45.976854	2026-05-07 17:00:37.240291	2026-05-08 16:56:03.563994
7	EMP001	أحمد محمد - موظف مالي	Financial Specialist	5	ahmed@company.com		6	21	41	USER	f	t	\N	\N	2026-05-07 17:00:37.240291	2026-05-08 16:56:07.130185
4	FIN001	رئيس القطاع المالي	Head of Finance Sector	5	fin.head@company.com	$2b$12$eCwXH9.JflzueEmZ5R565u24r1d/8egNxIUyEmouTdTWyR0I9w3pi	\N	16	33	USER	t	t	\N	2026-05-08 17:36:12.422263	2026-05-07 17:00:37.240291	2026-05-08 17:36:11.894484
2	PM001	مدير البرنامج	Program Manager	5	pm@company.com	$2b$12$X9VlgA5CMQYEbg8KqlMng.o6PMVw0otYevvPTKsas4LwGmuGx/Fsu	\N	15	39	PROGRAM_MANAGER	f	t	\N	2026-05-08 17:40:58.161889	2026-05-07 17:00:37.240291	2026-05-08 17:40:57.598426
8	EMP002	سارة أحمد - موظفة HR	HR Specialist	6	sara@company.com	$2b$12$fBV8Q5dIPbQWrSIEbtPHg.VrLEuiM6.pMm76JbYrFLaahxrv6Yy.m	5	21	34	USER	f	t	\N	\N	2026-05-07 17:00:37.240291	2026-05-08 18:26:55.089534
1	SYS001	مدير النظام	System Administrator	5	admin@company.com	$2b$12$PLjnGrVALpF6T/2edMqR4O1QoPVy0eBrjnosZtnHmW0UuBMxfSU9m	\N	15	39	GLOBAL_ADMIN	f	t	\N	2026-05-08 19:31:48.848565	2026-05-07 17:00:37.240291	2026-05-08 19:31:48.141923
\.


--
-- Name: delegations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delegations_id_seq', 1, false);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 53, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- Name: job_levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_levels_id_seq', 23, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 7, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 3, true);


--
-- Name: task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_assignments_id_seq', 1, false);


--
-- Name: task_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_logs_id_seq', 15, true);


--
-- Name: task_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_shares_id_seq', 2, true);


--
-- Name: task_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_steps_id_seq', 1, true);


--
-- Name: task_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_transfers_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: delegations delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_pkey PRIMARY KEY (id);


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
-- Name: job_levels job_levels_level_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_levels
    ADD CONSTRAINT job_levels_level_number_key UNIQUE (level_number);


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
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


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
-- Name: task_transfers task_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_transfers
    ADD CONSTRAINT task_transfers_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


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
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


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
-- Name: departments departments_job_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_job_level_id_fkey FOREIGN KEY (job_level_id) REFERENCES public.job_levels(id);


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
-- Name: departments fk_department_location; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_department_location FOREIGN KEY (location_id) REFERENCES public.locations(id);


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
-- Name: users users_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_work_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_work_location_id_fkey FOREIGN KEY (work_location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict S0Odqj7AGwT7E9jYx1kt8l8M9NIvC4devKV1UdXjTZ0S1QdIPaTGtLdtZUkZzbh

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict SHOtdZhqwwygl4Qye3JESXLInaMxm9rfZe6IcugVuleL3xMQrTLHdUGNQGczFd4

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- PostgreSQL database dump complete
--

\unrestrict SHOtdZhqwwygl4Qye3JESXLInaMxm9rfZe6IcugVuleL3xMQrTLHdUGNQGczFd4

--
-- PostgreSQL database cluster dump complete
--

