--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.5

-- Started on 2026-05-11 15:07:05

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


-- TẠO CÁC TÀI KHOẢN (ROLES) TRƯỚC KHI CẤP QUYỀN
CREATE ROLE ai_service_acc WITH LOGIN PASSWORD :'AI_DB_PASSWORD';
CREATE ROLE leaderboard_service_acc WITH LOGIN PASSWORD :'LEADER_DB_PASSWORD';
CREATE ROLE pvp_service_acc WITH LOGIN PASSWORD :'PVP_DB_PASSWORD';
CREATE ROLE user_service_acc WITH LOGIN PASSWORD :'USER_DB_PASSWORD';
--
-- TOC entry 8 (class 2615 OID 24584)
-- Name: schema_ai; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA schema_ai;


ALTER SCHEMA schema_ai OWNER TO postgres;

--
-- TOC entry 7 (class 2615 OID 24583)
-- Name: schema_leaderboard; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA schema_leaderboard;


ALTER SCHEMA schema_leaderboard OWNER TO postgres;

--
-- TOC entry 6 (class 2615 OID 24582)
-- Name: schema_pvp; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA schema_pvp;


ALTER SCHEMA schema_pvp OWNER TO postgres;

--
-- TOC entry 5 (class 2615 OID 24581)
-- Name: schema_user; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA schema_user;


ALTER SCHEMA schema_user OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 24762)
-- Name: ai_models; Type: TABLE; Schema: schema_ai; Owner: postgres
--

CREATE TABLE schema_ai.ai_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    difficulty_level integer NOT NULL,
    file_path character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid NOT NULL
);


ALTER TABLE schema_ai.ai_models OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24753)
-- Name: user_stats; Type: TABLE; Schema: schema_leaderboard; Owner: postgres
--

CREATE TABLE schema_leaderboard.user_stats (
    user_id uuid NOT NULL,
    name character varying(100),
    avatar character varying(255),
    elo integer DEFAULT 1200,
    total_matches integer DEFAULT 0,
    total_wins integer DEFAULT 0,
    total_draws integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE schema_leaderboard.user_stats OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24768)
-- Name: matches; Type: TABLE; Schema: schema_pvp; Owner: postgres
--

CREATE TABLE schema_pvp.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_type character varying(20) NOT NULL,
    player1_id uuid NOT NULL,
    player2_id uuid,
    bot_id uuid,
    winner_id uuid,
    status character varying(20) DEFAULT 'ONGOING'::character varying,
    move_log jsonb,
    start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp without time zone,
    end_reason character varying(20) DEFAULT 'NORMAL'::character varying
);


ALTER TABLE schema_pvp.matches OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24803)
-- Name: tournament_matches; Type: TABLE; Schema: schema_pvp; Owner: postgres
--

CREATE TABLE schema_pvp.tournament_matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    match_id uuid NOT NULL,
    round_number integer NOT NULL
);


ALTER TABLE schema_pvp.tournament_matches OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24788)
-- Name: tournament_participants; Type: TABLE; Schema: schema_pvp; Owner: postgres
--

CREATE TABLE schema_pvp.tournament_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tournament_id uuid NOT NULL,
    user_id uuid NOT NULL,
    score numeric(5,2) DEFAULT 0,
    buchholz_score numeric(5,2) DEFAULT 0
);


ALTER TABLE schema_pvp.tournament_participants OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24778)
-- Name: tournaments; Type: TABLE; Schema: schema_pvp; Owner: postgres
--

CREATE TABLE schema_pvp.tournaments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    organizer_id uuid NOT NULL,
    total_rounds integer NOT NULL,
    current_round integer DEFAULT 0,
    status character varying(20) DEFAULT 'OPEN'::character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE schema_pvp.tournaments OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24711)
-- Name: roles; Type: TABLE; Schema: schema_user; Owner: postgres
--

CREATE TABLE schema_user.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE schema_user.roles OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24735)
-- Name: user_roles; Type: TABLE; Schema: schema_user; Owner: postgres
--

CREATE TABLE schema_user.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE schema_user.user_roles OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24719)
-- Name: users; Type: TABLE; Schema: schema_user; Owner: postgres
--

CREATE TABLE schema_user.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(100),
    avatar character varying(255),
    email character varying(100),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE schema_user.users OWNER TO postgres;

--
-- TOC entry 4896 (class 0 OID 24762)
-- Dependencies: 225
-- Data for Name: ai_models; Type: TABLE DATA; Schema: schema_ai; Owner: postgres
--

COPY schema_ai.ai_models (id, name, difficulty_level, file_path, description, created_at, updated_at, created_by) FROM stdin;
33333333-0000-0000-0000-000000000001	Random Bot	1	/models/random.bin	\N	2026-04-12 17:27:20.08407	2026-04-12 17:27:20.08407	22222222-1111-1111-1111-000000000001
33333333-0000-0000-0000-000000000002	AlphaZero	3	/models/alphazero.onnx	\N	2026-04-12 17:27:20.08407	2026-04-12 17:27:20.08407	22222222-1111-1111-1111-000000000001
\.


--
-- TOC entry 4895 (class 0 OID 24753)
-- Dependencies: 224
-- Data for Name: user_stats; Type: TABLE DATA; Schema: schema_leaderboard; Owner: postgres
--

COPY schema_leaderboard.user_stats (user_id, name, avatar, elo, total_matches, total_wins, total_draws, updated_at) FROM stdin;
22222222-1111-1111-1111-000000000001	Hoàng Việt Anh	admin.png	1200	0	0	0	2026-04-14 10:30:02.182591
22222222-1111-1111-1111-000000000002	Nguyễn Văn An	player_pro.png	1203	2	1	0	2026-04-14 10:30:02.182591
22222222-1111-1111-1111-000000000003	Trần Thị Bích	noob_master.png	1191	3	1	0	2026-04-14 10:30:02.182591
22222222-1111-1111-1111-000000000004	Hoàng Văn Hoan	vanh123.png	1215	1	1	0	2026-04-14 10:30:02.182591
\.


--
-- TOC entry 4897 (class 0 OID 24768)
-- Dependencies: 226
-- Data for Name: matches; Type: TABLE DATA; Schema: schema_pvp; Owner: postgres
--

COPY schema_pvp.matches (id, match_type, player1_id, player2_id, bot_id, winner_id, status, move_log, start_time, end_time, end_reason) FROM stdin;
cd359565-c8e4-4089-aacd-edaaff29d5f6	PVP	22222222-1111-1111-1111-000000000003	22222222-1111-1111-1111-000000000002	\N	22222222-1111-1111-1111-000000000002	FINISHED	[]	2026-04-08 15:16:28.837899	2026-04-08 15:31:28.837899	NORMAL
346d59ef-500c-4087-8294-1a1e9fa4c9c2	PVP	22222222-1111-1111-1111-000000000002	22222222-1111-1111-1111-000000000003	\N	22222222-1111-1111-1111-000000000003	FINISHED	[]	2026-04-08 11:51:18.564343	2026-04-08 12:06:18.564343	NORMAL
3f9048f7-063c-4dad-a1ce-a02e2ce83bd6	PVP	22222222-1111-1111-1111-000000000004	22222222-1111-1111-1111-000000000003	\N	22222222-1111-1111-1111-000000000004	FINISHED	[]	2026-04-08 15:16:11.699709	2026-04-08 15:31:11.699709	NORMAL
\.


--
-- TOC entry 4900 (class 0 OID 24803)
-- Dependencies: 229
-- Data for Name: tournament_matches; Type: TABLE DATA; Schema: schema_pvp; Owner: postgres
--

COPY schema_pvp.tournament_matches (id, tournament_id, match_id, round_number) FROM stdin;
\.


--
-- TOC entry 4899 (class 0 OID 24788)
-- Dependencies: 228
-- Data for Name: tournament_participants; Type: TABLE DATA; Schema: schema_pvp; Owner: postgres
--

COPY schema_pvp.tournament_participants (id, tournament_id, user_id, score, buchholz_score) FROM stdin;
e8d2d8bd-38de-4565-a281-fdcf952e1438	44444444-0000-0000-0000-000000000001	22222222-1111-1111-1111-000000000001	1.00	0.00
2f5d5035-eed9-4df3-aa30-cb1c0993d66c	44444444-0000-0000-0000-000000000001	22222222-1111-1111-1111-000000000002	0.00	0.00
\.


--
-- TOC entry 4898 (class 0 OID 24778)
-- Dependencies: 227
-- Data for Name: tournaments; Type: TABLE DATA; Schema: schema_pvp; Owner: postgres
--

COPY schema_pvp.tournaments (id, name, organizer_id, total_rounds, current_round, status, start_date, end_date, created_at, updated_at) FROM stdin;
44444444-0000-0000-0000-000000000001	Othello Championship	22222222-1111-1111-1111-000000000001	5	1	ONGOING	\N	\N	2026-03-30 15:32:26.30445	2026-03-30 15:32:26.30445
\.


--
-- TOC entry 4892 (class 0 OID 24711)
-- Dependencies: 221
-- Data for Name: roles; Type: TABLE DATA; Schema: schema_user; Owner: postgres
--

COPY schema_user.roles (id, role_name, created_at, updated_at) FROM stdin;
11111111-0000-0000-0000-000000000001	USER	2026-04-14 10:32:12.335171	2026-04-14 10:32:12.335171
11111111-0000-0000-0000-000000000002	ADMIN	2026-04-14 10:32:12.335171	2026-04-14 10:32:12.335171
\.


--
-- TOC entry 4894 (class 0 OID 24735)
-- Dependencies: 223
-- Data for Name: user_roles; Type: TABLE DATA; Schema: schema_user; Owner: postgres
--

COPY schema_user.user_roles (id, user_id, role_id) FROM stdin;
7f45ae42-04fb-4346-90de-38a3879c3853	22222222-1111-1111-1111-000000000001	11111111-0000-0000-0000-000000000002
a70d975b-5138-496a-bcf5-cc03b27110ad	22222222-1111-1111-1111-000000000002	11111111-0000-0000-0000-000000000001
f2334d26-9f6d-498e-b300-184d455c7914	22222222-1111-1111-1111-000000000003	11111111-0000-0000-0000-000000000001
0e4c4874-fd1f-49e6-b8e7-c555e53b5aed	22222222-1111-1111-1111-000000000004	11111111-0000-0000-0000-000000000001
\.


--
-- TOC entry 4893 (class 0 OID 24719)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: schema_user; Owner: postgres
--

COPY schema_user.users (id, username, password, name, avatar, email, status, is_deleted, created_at, updated_at) FROM stdin;
22222222-1111-1111-1111-000000000001	admin	$2a$10$uFwWt3SV.x5FFkts.1LB3OvC7iHibgF2DQROo/NS7Hqxry9CLqpSK	Hoàng Việt Anh	admin.png	admin@gmail.com	ACTIVE	f	2026-03-30 15:32:26.30445	2026-03-30 15:32:26.30445
22222222-1111-1111-1111-000000000002	player_pro	$2a$10$uFwWt3SV.x5FFkts.1LB3OvC7iHibgF2DQROo/NS7Hqxry9CLqpSK	Nguyễn Văn An	player_pro.png	player_pro@gmail.com	ACTIVE	f	2026-03-30 15:32:26.30445	2026-03-30 15:32:26.30445
22222222-1111-1111-1111-000000000003	noob_master	$2a$10$uFwWt3SV.x5FFkts.1LB3OvC7iHibgF2DQROo/NS7Hqxry9CLqpSK	Trần Thị Bích	noob_master.png	noob_master@gmail.com	ACTIVE	f	2026-03-30 15:32:26.30445	2026-03-30 15:32:26.30445
22222222-1111-1111-1111-000000000004	vanh123	$2a$10$uFwWt3SV.x5FFkts.1LB3OvC7iHibgF2DQROo/NS7Hqxry9CLqpSK	Hoàng Văn Hoan	vanh123.png	vanh123@gmail.com	ACTIVE	f	2026-04-28 15:59:16.268876	2026-05-07 10:55:29.973007
\.


--
-- TOC entry 4727 (class 2606 OID 24767)
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: schema_ai; Owner: postgres
--

ALTER TABLE ONLY schema_ai.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (id);


--
-- TOC entry 4729 (class 2606 OID 24827)
-- Name: ai_models uk_ai_model_name; Type: CONSTRAINT; Schema: schema_ai; Owner: postgres
--

ALTER TABLE ONLY schema_ai.ai_models
    ADD CONSTRAINT uk_ai_model_name UNIQUE (name);


--
-- TOC entry 4725 (class 2606 OID 24761)
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: schema_leaderboard; Owner: postgres
--

ALTER TABLE ONLY schema_leaderboard.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4731 (class 2606 OID 24777)
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- TOC entry 4739 (class 2606 OID 24808)
-- Name: tournament_matches tournament_matches_pkey; Type: CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_matches
    ADD CONSTRAINT tournament_matches_pkey PRIMARY KEY (id);


--
-- TOC entry 4735 (class 2606 OID 24795)
-- Name: tournament_participants tournament_participants_pkey; Type: CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_participants
    ADD CONSTRAINT tournament_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 4733 (class 2606 OID 24787)
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- TOC entry 4737 (class 2606 OID 24797)
-- Name: tournament_participants unique_participant; Type: CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_participants
    ADD CONSTRAINT unique_participant UNIQUE (tournament_id, user_id);


--
-- TOC entry 4741 (class 2606 OID 24810)
-- Name: tournament_matches unique_tournament_match; Type: CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_matches
    ADD CONSTRAINT unique_tournament_match UNIQUE (tournament_id, match_id);


--
-- TOC entry 4711 (class 2606 OID 24716)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4713 (class 2606 OID 24718)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4721 (class 2606 OID 24742)
-- Name: user_roles unique_user_role; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.user_roles
    ADD CONSTRAINT unique_user_role UNIQUE (user_id, role_id);


--
-- TOC entry 4723 (class 2606 OID 24740)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4715 (class 2606 OID 24734)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4717 (class 2606 OID 24730)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4719 (class 2606 OID 24732)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4745 (class 2606 OID 24816)
-- Name: tournament_matches fk_tm_match; Type: FK CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_matches
    ADD CONSTRAINT fk_tm_match FOREIGN KEY (match_id) REFERENCES schema_pvp.matches(id) ON DELETE CASCADE;


--
-- TOC entry 4746 (class 2606 OID 24811)
-- Name: tournament_matches fk_tm_tournament; Type: FK CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_matches
    ADD CONSTRAINT fk_tm_tournament FOREIGN KEY (tournament_id) REFERENCES schema_pvp.tournaments(id) ON DELETE CASCADE;


--
-- TOC entry 4744 (class 2606 OID 24798)
-- Name: tournament_participants fk_tp_tournament; Type: FK CONSTRAINT; Schema: schema_pvp; Owner: postgres
--

ALTER TABLE ONLY schema_pvp.tournament_participants
    ADD CONSTRAINT fk_tp_tournament FOREIGN KEY (tournament_id) REFERENCES schema_pvp.tournaments(id) ON DELETE CASCADE;


--
-- TOC entry 4742 (class 2606 OID 24748)
-- Name: user_roles fk_ur_role; Type: FK CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.user_roles
    ADD CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES schema_user.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4743 (class 2606 OID 24743)
-- Name: user_roles fk_ur_user; Type: FK CONSTRAINT; Schema: schema_user; Owner: postgres
--

ALTER TABLE ONLY schema_user.user_roles
    ADD CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES schema_user.users(id) ON DELETE CASCADE;


--
-- TOC entry 4906 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- TOC entry 4907 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA schema_ai; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA schema_ai TO ai_service_acc;


--
-- TOC entry 4908 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA schema_leaderboard; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA schema_leaderboard TO leaderboard_service_acc;


--
-- TOC entry 4909 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA schema_pvp; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA schema_pvp TO pvp_service_acc;


--
-- TOC entry 4910 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA schema_user; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA schema_user TO user_service_acc;


--
-- TOC entry 4911 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE ai_models; Type: ACL; Schema: schema_ai; Owner: postgres
--

GRANT ALL ON TABLE schema_ai.ai_models TO ai_service_acc;


--
-- TOC entry 4912 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE user_stats; Type: ACL; Schema: schema_leaderboard; Owner: postgres
--

GRANT ALL ON TABLE schema_leaderboard.user_stats TO leaderboard_service_acc;


--
-- TOC entry 4913 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE matches; Type: ACL; Schema: schema_pvp; Owner: postgres
--

GRANT ALL ON TABLE schema_pvp.matches TO pvp_service_acc;


--
-- TOC entry 4914 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE tournament_matches; Type: ACL; Schema: schema_pvp; Owner: postgres
--

GRANT ALL ON TABLE schema_pvp.tournament_matches TO pvp_service_acc;


--
-- TOC entry 4915 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE tournament_participants; Type: ACL; Schema: schema_pvp; Owner: postgres
--

GRANT ALL ON TABLE schema_pvp.tournament_participants TO pvp_service_acc;


--
-- TOC entry 4916 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE tournaments; Type: ACL; Schema: schema_pvp; Owner: postgres
--

GRANT ALL ON TABLE schema_pvp.tournaments TO pvp_service_acc;


--
-- TOC entry 4917 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE roles; Type: ACL; Schema: schema_user; Owner: postgres
--

GRANT ALL ON TABLE schema_user.roles TO user_service_acc;


--
-- TOC entry 4918 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE user_roles; Type: ACL; Schema: schema_user; Owner: postgres
--

GRANT ALL ON TABLE schema_user.user_roles TO user_service_acc;


--
-- TOC entry 4919 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE users; Type: ACL; Schema: schema_user; Owner: postgres
--

GRANT ALL ON TABLE schema_user.users TO user_service_acc;


--
-- TOC entry 2082 (class 826 OID 24592)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: schema_ai; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schema_ai GRANT ALL ON TABLES TO ai_service_acc;


--
-- TOC entry 2081 (class 826 OID 24591)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: schema_leaderboard; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schema_leaderboard GRANT ALL ON TABLES TO leaderboard_service_acc;


--
-- TOC entry 2080 (class 826 OID 24590)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: schema_pvp; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schema_pvp GRANT ALL ON TABLES TO pvp_service_acc;


--
-- TOC entry 2079 (class 826 OID 24589)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: schema_user; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schema_user GRANT ALL ON TABLES TO user_service_acc;


-- Completed on 2026-05-11 15:07:05

--
-- PostgreSQL database dump complete
--

