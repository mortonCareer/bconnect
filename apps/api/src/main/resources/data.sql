-- seed data : 테스트 순서대로 선언
INSERT INTO otps (id, phone, code, code_expired_at, code_revoked, attempts, daily_count, last_sent_at, token, token_expired_at, token_revoked, created_at, modified_at) VALUES
(1, '01000000001', '000001', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', NULL, NULL, NULL, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, '01000000002', '000002', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', NULL, NULL, NULL, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, '01000000003', '000003', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', 'signup-token', TIMESTAMP '2026-12-31 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, '01000000005', '000005', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', NULL, NULL, NULL, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO members (id, username, name, phone, picture, role, created_at, modified_at) VALUES
(0, 'system', '시스템', '01000000000', 'https://image.com', 'ADMIN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(1, 'test', '테스트', '01000000001', 'https://image.com', 'ADMIN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 'foreman1', '반장1', '01000000005', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 'foreman2', '반장2', '01000000006', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, 'foreman3', '반장3', '01000000007', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(5, 'foreman4', '반장4', '01000000008', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(6, 'foreman5', '반장5', '01000000009', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO sessions (id, username, agent, ip, refresh_token, revoked, created_at, modified_at) VALUES
(1, 'foreman1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '000.000.000.000', 'refresh-token', false, TIMESTAMP '2026-12-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profiles (id, member_id, primary_trade, experience, headline, about, zipcode, city, state, street, detail, latitude, longitude, created_at, modified_at) VALUES
(1, 1, 'TILING', 10, '프로필1', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 3, 'TILING', 10, '프로필2', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 4, 'TILING', 10, '프로필3', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, 5, 'TILING', 10, '프로필4', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(5, 6, 'TILING', 10, '프로필5', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profile_trades (profile_id, trade) VALUES
(1, 'TILING'),
(1, 'FILM_SHEET'),
(2, 'TILING'),
(2, 'FILM_SHEET'),
(3, 'TILING'),
(3, 'FILM_SHEET'),
(4, 'TILING'),
(4, 'FILM_SHEET'),
(5, 'TILING'),
(5, 'FILM_SHEET');

INSERT INTO coworker_requests (id, from_id, to_id) VALUES
(1, 4, 1),
(2, 5, 1);

INSERT INTO coworkers (id, min_id, max_id) VALUES
(1, 1, 6);

INSERT INTO recommendations (id, from_id, to_id, content, visible, created_at, modified_at) VALUES
(1, 6, 1, '추천서1', true, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO credentials (id, member_id, type, status, expired_at, created_at, modified_at) VALUES
(1, 1, 'IDENTITY_VERIFICATION', 'PENDING', DATE '2026-12-31', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 1, 'SKILL_GRADE_CERTIFICATE', 'PENDING', DATE '2026-12-31', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

-- for special entities
ALTER TABLE otps ALTER COLUMN id RESTART WITH 100;
ALTER TABLE members ALTER COLUMN id RESTART WITH 100;
ALTER TABLE sessions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE chats ALTER COLUMN id RESTART WITH 100;
ALTER TABLE participants ALTER COLUMN id RESTART WITH 100;
ALTER TABLE messages ALTER COLUMN id RESTART WITH 100;
ALTER TABLE profiles ALTER COLUMN id RESTART WITH 100;
ALTER TABLE tasks ALTER COLUMN id RESTART WITH 100;
ALTER TABLE companies ALTER COLUMN id RESTART WITH 100;
ALTER TABLE projects ALTER COLUMN id RESTART WITH 100;
ALTER TABLE posts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE credentials ALTER COLUMN id RESTART WITH 100;
ALTER TABLE coworkers ALTER COLUMN id RESTART WITH 100;
ALTER TABLE coworker_requests ALTER COLUMN id RESTART WITH 100;
ALTER TABLE recommendations ALTER COLUMN id RESTART WITH 100;
