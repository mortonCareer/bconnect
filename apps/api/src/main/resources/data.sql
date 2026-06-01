-- id 1-9 for test, 10-19 for seed
INSERT INTO otps (id, phone, code, code_expired_at, code_revoked, attempts, daily_count, last_sent_at, token, token_expired_at, token_revoked, created_at, modified_at) VALUES
(1, '01000000001', '000001', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', NULL, NULL, NULL, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, '01000000002', '000002', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', NULL, NULL, NULL, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, '01000000003', '000003', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', 'signup-token', TIMESTAMP '2026-12-31 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO members (id, username, name, phone, picture, role, created_at, modified_at) VALUES
(0, 'system', '시스템', '01000000000', 'https://image.com', 'ADMIN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(1, 'test', '테스트', '01000000001', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(10, 'foreman1', '반장1', '01000000010', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(11, 'foreman2', '반장2', '01000000011', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(12, 'contractor1', '업체1', '01000000012', 'https://image.com', 'CONTRACTOR', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');


INSERT INTO sessions (id, username, agent, ip, refresh_token, revoked, created_at, modified_at) VALUES
(1, 'foreman1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '000.000.000.000', 'refresh-token', false, TIMESTAMP '2026-12-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profiles (id, member_id, primary_trade, experience, headline, about, zipcode, city, state, street, detail, latitude, longitude, created_at, modified_at) VALUES
(10, 10, 'TILING', 10, '프로필2', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(11, 11, 'TILING', 10, '프로필3', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profile_trades (profile_id, trade) VALUES
(10, 'TILING'),
(10, 'FILM_SHEET'),
(11, 'TILING'),
(11, 'FILM_SHEET');

INSERT INTO tasks (id, profile_id, company, zipcode, city, state, street, detail, latitude, longitude, task_title, event_title, start_date, end_date, created_at, modified_at) VALUES
(10, 10, '업체', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294000, 126.974000, '작업1', '일정1', DATE '2026-06-01', DATE '2026-06-03', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(11, 11, '업체', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294000, 126.974000, '작업2', '일정2', DATE '2026-06-04', DATE '2026-06-06', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(12, NULL, '업체', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294000, 126.974000, '작업3', '일정3', DATE '2026-06-06', DATE '2026-06-09', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO task_trades (task_id, trade) VALUES
(10, 'TILING'),
(10, 'FILM_SHEET'),
(11, 'TILING'),
(11, 'FILM_SHEET'),
(12, 'TILING'),
(12, 'FILM_SHEET');

INSERT INTO posts (id, profile_id, task_id, content, created_at, modified_at) VALUES
(10, 10, 10, '게시글1', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(11, 10, NULL, '게시글2', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO post_images (post_id, images) VALUES
(10, 'https://image.com'),
(10, 'https://image.com'),
(11, 'https://image.com'),
(11, 'https://image.com');

INSERT INTO credentials (id, profile_id, type, status, expired_at, created_at, modified_at) VALUES
(10, 10, 'IDENTITY_VERIFICATION', 'ACCEPTED', DATE '2026-12-31', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO coworkers (id, min_id, max_id) VALUES
(10, 10, 11);

INSERT INTO recommendations (id, from_id, to_id, content, visible, created_at, modified_at) VALUES
(10, 10, 11, '추천서1', true, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(11, 11, 10, '추천서2', true, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

-- for special entities
ALTER TABLE otps ALTER COLUMN id RESTART WITH 100;
ALTER TABLE members ALTER COLUMN id RESTART WITH 100;
ALTER TABLE sessions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE chats ALTER COLUMN id RESTART WITH 100;
ALTER TABLE participants ALTER COLUMN id RESTART WITH 100;
ALTER TABLE messages ALTER COLUMN id RESTART WITH 100;
ALTER TABLE profiles ALTER COLUMN id RESTART WITH 100;
ALTER TABLE tasks ALTER COLUMN id RESTART WITH 100;
ALTER TABLE posts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE credentials ALTER COLUMN id RESTART WITH 100;
ALTER TABLE coworkers ALTER COLUMN id RESTART WITH 100;
ALTER TABLE coworker_requests ALTER COLUMN id RESTART WITH 100;
ALTER TABLE recommendations ALTER COLUMN id RESTART WITH 100;
