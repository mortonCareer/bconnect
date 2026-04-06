-- members: 인테리어 기술자 3명
INSERT INTO members (id, username, name, phone, picture, role, created_at, modified_at, status) VALUES
(1, 'chulsoo',  '김철수', '01012345678', 'https://bconnect.to/_assets/v11/ad13bf96beebe659cc0b7ec32f83f99f6b71c6ec.png?w=2048',  'SKILLED',    TIMESTAMP '2026-02-20 09:00:00', TIMESTAMP '2026-02-20 09:00:00', 'ACTIVE'),
(2, 'younghee', '박영희', '01023456789', 'https://bconnect.to/_assets/v11/ad13bf96beebe659cc0b7ec32f83f99f6b71c6ec.png?w=2048', 'FOREMAN',    TIMESTAMP '2026-02-20 10:00:00', TIMESTAMP '2026-02-20 10:00:00', 'ACTIVE'),
(3, 'junho',    '이준호', '01034567890', 'https://bconnect.to/_assets/v11/ad13bf96beebe659cc0b7ec32f83f99f6b71c6ec.png?w=2048',    'CONTRACTOR', TIMESTAMP '2026-02-21 08:00:00', TIMESTAMP '2026-02-21 08:00:00', 'ACTIVE');

-- chats: 현장별 대화방
INSERT INTO chats (id, title, created_at, modified_at, status) VALUES
(1, '강남 아파트 타일 작업',     TIMESTAMP '2026-02-22 09:00:00', TIMESTAMP '2026-02-22 09:00:00', 'ACTIVE'),
(2, '분당 오피스텔 전기 공사',   TIMESTAMP '2026-02-22 10:00:00', TIMESTAMP '2026-02-22 10:00:00', 'ACTIVE'),
(3, '서초 상가 철거 견적',       TIMESTAMP '2026-02-22 11:00:00', TIMESTAMP '2026-02-22 11:00:00', 'ACTIVE');

-- otps: 가입 시 사용된 인증 기록
INSERT INTO otps (id, phone, code, code_expired_at, daily_count, attempt_count, signup_token, signup_token_expired_at, created_at, modified_at, status) VALUES
(1, '01012345678', '482917', TIMESTAMP '2026-02-20 08:58:00', 1, 1, 'st_a1b2c3d4e5', TIMESTAMP '2026-02-20 09:25:00', TIMESTAMP '2026-02-20 08:55:00', TIMESTAMP '2026-02-20 09:00:00', 'ACTIVE'),
(2, '01023456789', '173625', TIMESTAMP '2026-02-20 09:58:00', 1, 1, 'st_f6g7h8i9j0', TIMESTAMP '2026-02-20 10:25:00', TIMESTAMP '2026-02-20 09:55:00', TIMESTAMP '2026-02-20 10:00:00', 'ACTIVE'),
(3, '01034567890', '905314', TIMESTAMP '2026-02-21 07:58:00', 1, 1, 'st_k1l2m3n4o5', TIMESTAMP '2026-02-21 08:25:00', TIMESTAMP '2026-02-21 07:55:00', TIMESTAMP '2026-02-21 08:00:00', 'ACTIVE');

-- sessions: 로그인 세션
INSERT INTO sessions (id, username, agent, ip, refresh_token, revoked, created_at, modified_at, status) VALUES
(1, 'chulsoo',  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0)',  '223.38.12.101',  'rt_chulsoo_a1b2c3d4e5f6',  false, TIMESTAMP '2026-02-25 09:00:00', TIMESTAMP '2026-02-25 09:00:00', 'ACTIVE'),
(2, 'younghee', 'Mozilla/5.0 (Linux; Android 16)',           '175.209.45.203', 'rt_younghee_g7h8i9j0k1l2', false, TIMESTAMP '2026-02-25 10:00:00', TIMESTAMP '2026-02-25 10:00:00', 'ACTIVE'),
(3, 'junho',    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '121.134.78.55',  'rt_junho_m3n4o5p6q7r8',    false, TIMESTAMP '2026-02-25 11:00:00', TIMESTAMP '2026-02-25 11:00:00', 'ACTIVE');

-- tasks: 인테리어 현장 작업
INSERT INTO tasks (id, company, zipcode, city, state, street, detail, latitude, longitude, task_title, event_title, start_date, end_date, created_at, modified_at, status) VALUES
(1, '드림인테리어', '06241', '서울특별시', '강남구',        '테헤란로 123',  '래미안 301호',    37.5012743, 127.0396857, '욕실 타일 시공', '강남 아파트 리모델링',   DATE '2026-03-01', DATE '2026-03-15', TIMESTAMP '2026-02-20 09:00:00', TIMESTAMP '2026-02-20 09:00:00', 'ACTIVE'),
(2, '한빛건설',     '13494', '경기도',     '성남시 분당구', '판교역로 45',   '힐스테이트 B동',  37.3947138, 127.1112341, '전기 배선 공사', '분당 오피스텔 인테리어', DATE '2026-03-10', DATE '2026-03-20', TIMESTAMP '2026-02-21 09:00:00', TIMESTAMP '2026-02-21 09:00:00', 'ACTIVE'),
(3, '서초디자인',   '06621', '서울특별시', '서초구',        '서초대로 78',   '상가 1층 전체',   37.4837121, 127.0325764, '철거 후 도장',   '서초 상가 리뉴얼',       DATE '2026-03-05', DATE '2026-03-25', TIMESTAMP '2026-02-22 09:00:00', TIMESTAMP '2026-02-22 09:00:00', 'ACTIVE');

-- ===========================================
-- Level 1 (독립 테이블 참조)
-- ===========================================

-- messages: 채팅 메시지
INSERT INTO messages (id, chat_id, member_id, content, created_at, modified_at, status) VALUES
(1, 1, 3, '김철수님, 강남 현장 욕실 타일 작업 가능하신가요? 포세린 600x600입니다.',         TIMESTAMP '2026-02-22 09:05:00', TIMESTAMP '2026-02-22 09:05:00', 'ACTIVE'),
(2, 1, 1, '네 반장님, 3월 1일부터 투입 가능합니다. 줄눈 색상은 정해졌나요?',                TIMESTAMP '2026-02-22 09:10:00', TIMESTAMP '2026-02-22 09:10:00', 'ACTIVE'),
(3, 2, 2, '분당 전기 공사 10일 시작인데, 조명 자재 입고 일정 확인 부탁드립니다.',            TIMESTAMP '2026-02-22 10:05:00', TIMESTAMP '2026-02-22 10:05:00', 'ACTIVE');

-- participants: 대화 참여자
INSERT INTO participants (id, chat_id, member_id, last_idx, created_at, modified_at, status) VALUES
(1, 1, 1, 2, TIMESTAMP '2026-02-22 09:00:00', TIMESTAMP '2026-02-22 09:10:00', 'ACTIVE'),
(2, 1, 3, 1, TIMESTAMP '2026-02-22 09:00:00', TIMESTAMP '2026-02-22 09:05:00', 'ACTIVE'),
(3, 2, 2, 3, TIMESTAMP '2026-02-22 10:00:00', TIMESTAMP '2026-02-22 10:05:00', 'ACTIVE');

-- posts: 작업 기록 게시물
INSERT INTO posts (id, author_id, task_id, content, created_at, modified_at, status) VALUES
(1, 1, 1, '강남 아파트 욕실 바닥 타일 시공 완료. 포세린 600x600 시공, 줄눈 백색 마감.',                  TIMESTAMP '2026-02-23 09:00:00', TIMESTAMP '2026-02-23 09:00:00', 'ACTIVE'),
(2, 2, 2, '분당 오피스텔 B동 전기 배선 1차 완료. 내일 조명 및 콘센트 설치 예정.',                         TIMESTAMP '2026-02-23 14:00:00', TIMESTAMP '2026-02-23 14:00:00', 'ACTIVE'),
(3, 3, 3, '서초 상가 기존 내장재 철거 완료. 내력벽 확인 후 도장 작업 3/10 착수 예정.',                    TIMESTAMP '2026-02-24 10:00:00', TIMESTAMP '2026-02-24 10:00:00', 'ACTIVE');

-- profiles: 기술자 프로필
INSERT INTO profiles (id, member_id, primary_trade, experience, headline, about, zipcode, city, state, street, detail, latitude, longitude, created_at, modified_at, status) VALUES
(1, 1, 'TILING',      7,  '타일 전문 기공 7년차',       '아파트·상가 욕실 및 주방 타일 시공 전문. 포세린, 대리석, 모자이크 타일 모두 시공 가능합니다.',                    '04778', '서울특별시', '성동구',  '왕십리로 88', NULL,       37.5613156, 127.0375860, TIMESTAMP '2026-02-20 09:00:00', TIMESTAMP '2026-02-20 09:00:00', 'ACTIVE'),
(2, 2, 'ELECTRICAL', 17, '전기 반장 17년 경력',         '인테리어 전기 배선, 조명 설치, 분전반 교체 전문. 아파트·오피스텔 대형 현장 반장 경험 다수 보유.', '21554', '인천광역시', '남동구',  '인하로 55',   NULL,       37.4562871, 126.7052062, TIMESTAMP '2026-02-20 10:00:00', TIMESTAMP '2026-02-20 10:00:00', 'ACTIVE'),
(3, 3, 'DESIGN',     10, '인테리어 디자인·시공 10년차', '주거 및 상업 공간 인테리어 설계부터 시공 관리까지. 합리적인 견적과 트렌디한 디자인을 제공합니다.',                '06621', '서울특별시', '서초구',  '서초대로 78', '3층 사무실', 37.4837121, 127.0325764, TIMESTAMP '2026-02-21 08:00:00', TIMESTAMP '2026-02-21 08:00:00', 'ACTIVE');

-- ===========================================
-- Level 2 (Level 1 테이블 참조)
-- ===========================================

-- post_images: 작업 사진
INSERT INTO post_images (post_id, images) VALUES
(1, 'https://bconnect.to/_assets/v11/ad13bf96beebe659cc0b7ec32f83f99f6b71c6ec.png?w=2048'),
(1, 'https://bconnect.to/_assets/v11/ad13bf96beebe659cc0b7ec32f83f99f6b71c6ec.png?w=2048'),
(2, 'https://bconnect.to/_assets/v11/ad13bf96beebe659cc0b7ec32f83f99f6b71c6ec.png?w=2048');

-- profile_trades: 기술자 보유 직종
INSERT INTO profile_trades (profile_id, trade) VALUES
(1, 'TILING'),
(1, 'GROUTING'),
(2, 'ELECTRICAL'),
(2, 'PLUMBING'),
(3, 'DESIGN'),
(3, 'DEMOLITION');

-- task_trades: 현장 필요 직종
INSERT INTO task_trades (task_id, trade) VALUES
(1, 'TILING'),
(1, 'GROUTING'),
(2, 'ELECTRICAL'),
(2, 'PLUMBING'),
(3, 'DEMOLITION'),
(3, 'PAINTING');
