INSERT INTO otps (id, phone, code, code_expired_at, code_revoked, attempts, daily_count, last_sent_at, token, token_expired_at, token_revoked, created_at, modified_at) VALUES
-- otp test
(1, '01000000001', '000001', TIMESTAMP '2026-01-01 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', 'signup-token-1', TIMESTAMP '2026-12-01 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, '01000000010', '000010', TIMESTAMP '2026-01-01 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', 'signup-token-2', TIMESTAMP '2026-12-01 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
-- auth test
(3, '01000000011', '000011', TIMESTAMP '2026-01-01 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', 'signup-token-3', TIMESTAMP '2026-12-01 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, '01000000012', '000012', TIMESTAMP '2026-01-01 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', 'signup-token-4', TIMESTAMP '2026-12-01 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO members (id, username, name, phone, picture, role, created_at, modified_at) VALUES
(0, 'system', '시스템', '01000000000', 'https://image.com', 'ADMIN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(1, 'username1', '업체', '01000000001', 'https://image.com', 'CONTRACTOR', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 'username2', '반장1', '01000000002', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 'username3', '반장2', '01000000003', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, 'username4', '반장3', '01000000004', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(5, 'username12', '탈퇴', '01000000012', 'https://image.com', 'FOREMAN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO sessions (id, username, agent, ip, refresh_token, revoked, created_at, modified_at) VALUES
(1, 'username1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '000.000.000.000', 'refresh-token', false, TIMESTAMP '2026-12-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO chats (id, title, created_at, modified_at) VALUES
(1, '채팅방1', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO participants (id, chat_id, member_id, last_idx, created_at, modified_at) VALUES
(1, 1, 1, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 1, 2, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO messages (id, chat_id, member_id, type, content, created_at, modified_at) VALUES
(1, 1, 0, 'SYSTEM', '채팅방이 생성되었습니다.', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 1, 2, 'TEXT', '메시지2', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profiles (id, member_id, primary_trade, experience, headline, about, zipcode, city, state, street, detail, latitude, longitude, created_at, modified_at) VALUES
(1, 2, 'TILING', 10, '프로필1', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 3, 'TILING', 10, '프로필2', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 4, 'TILING', 10, '프로필3', '소개', '00000', '경기도', '수원시 장안구', '도로명주소', NULL, 37.294000, 126.974000, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profile_trades (profile_id, trade) VALUES
(1, 'TILING'),
(1, 'FILM_SHEET'),
(2, 'TILING'),
(2, 'FILM_SHEET'),
(3, 'TILING'),
(3, 'FILM_SHEET');

INSERT INTO tasks (id, profile_id, company, zipcode, city, state, street, detail, latitude, longitude, task_title, event_title, start_date, end_date, created_at, modified_at) VALUES
(1, 1, '업체', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294000, 126.974000, '작업1', '일정1', DATE '2026-06-01', DATE '2026-06-03', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 2, '업체', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294000, 126.974000, '작업2', '일정2', DATE '2026-06-04', DATE '2026-06-06', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, NULL, '업체', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294000, 126.974000, '작업3', '일정3', DATE '2026-06-06', DATE '2026-06-09', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO task_trades (task_id, trade) VALUES
(1, 'TILING'),
(1, 'FILM_SHEET'),
(2, 'TILING'),
(2, 'FILM_SHEET'),
(3, 'TILING'),
(3, 'FILM_SHEET');

INSERT INTO posts (id, profile_id, task_id, content, created_at, modified_at) VALUES
(1, 1, 1, '게시글1', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 1, NULL, '게시글2', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO post_images (post_id, images) VALUES
(1, 'https://image.com'),
(1, 'https://image.com'),
(2, 'https://image.com'),
(2, 'https://image.com');

INSERT INTO credentials (id, profile_id, type, status, expired_at, created_at, modified_at) VALUES
(1, 1, 'IDENTITY_VERIFICATION', 'ACCEPTED', DATE '2028-12-31', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO coworkers (id, min_id, max_id) VALUES
(1, 1, 2);

INSERT INTO coworker_requests (id, from_id, to_id) VALUES
(1, 3, 1);

INSERT INTO recommendations (id, from_id, to_id, content, visible, created_at, modified_at) VALUES
(1, 2, 1, '추천서1', true, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

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
