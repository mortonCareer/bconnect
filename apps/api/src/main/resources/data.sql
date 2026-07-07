-- 테스트 데이터
INSERT INTO otps (id, phone, code, expired_at, revoked, attempts, daily_count, last_sent_at, created_at, modified_at) VALUES
(1, '01000000001', '000001', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, '01000000002', '000002', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, '01000000003', '000003', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, '01000000004', '000004', TIMESTAMP '2026-12-31 00:00:00', false, 0, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO signup_tokens (id, phone, token, expired_at, revoked, created_at, modified_at) VALUES
(1, '01000000004', '932739eece2b7d31922b6d13a4a5f9caa895139a7d8bc549472a5682b624f9b5', TIMESTAMP '2026-12-31 00:00:00', false, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO members (id, username, name, phone, role, created_at, modified_at) VALUES
(0, 'system', '시스템', '01000000000', 'ADMIN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(1, 'test', '테스트', '01000000002', 'ADMIN', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 'foreman1', '반장1', '01000000003', 'USER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 'foreman2', '반장2', '01000000006', 'USER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, 'foreman3', '반장3', '01000000007', 'USER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(5, 'foreman4', '반장4', '01000000008', 'USER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(6, 'foreman5', '반장5', '01000000009', 'USER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(7, 'foreman6', '반장6', '01000000011', 'USER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profiles (id, member_id, role, primary_trade, experience, headline, about, zipcode, city, state, street, detail, latitude, longitude, created_at, modified_at) VALUES
(1, 2, 'FOREMAN', 'TILING', 5, '한줄소개2', '소개글2', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294, 126.974, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 3, 'FOREMAN', 'WATERPROOFING', 6, '한줄소개3', '소개글3', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294, 126.974, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 4, 'FOREMAN', 'PAINTING', 7, '한줄소개4', '소개글4', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294, 126.974, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, 5, 'FOREMAN', 'CARPENTRY', 8, '한줄소개5', '소개글5', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294, 126.974, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(5, 6, 'FOREMAN', 'ELECTRICAL', 9, '한줄소개6', '소개글6', '00000', '경기도', '수원시 장안구', '도로명주소', '상세주소', 37.294, 126.974, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO profile_trades (profile_id, trade) VALUES
(1, 'TILING'),
(2, 'WATERPROOFING'),
(3, 'PAINTING'),
(4, 'CARPENTRY'),
(5, 'ELECTRICAL');

INSERT INTO coworker_requests (id, from_id, to_id, created_at, modified_at) VALUES
(1, 4, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 5, 1, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO coworkers (id, min_id, max_id, created_at, modified_at) VALUES
(1, 1, 6, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO recommendations (id, from_id, to_id, content, visible, created_at, modified_at) VALUES
(1, 6, 1, '추천서1', true, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO credentials (id, member_id, type, status, expired_at, created_at, modified_at) VALUES
(1, 1, 'IDENTITY_VERIFICATION', 'PENDING', DATE '2026-12-31', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 1, 'SKILL_GRADE_CERTIFICATE', 'PENDING', DATE '2026-12-31', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO attachments (id, member_id, type, status, context, context_id, reference_type, reference_id, uuid, stem, ext, content_type, size, created_at, modified_at) VALUES
(1, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, NULL, NULL, 'seed-attachment-1', 'avatar', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(2, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, NULL, NULL, 'seed-attachment-2', 'credential', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(3, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, 'CREDENTIAL', 1, 'seed-attachment-3', 'credential', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(4, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, 'CREDENTIAL', 2, 'seed-attachment-4', 'credential', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(5, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, NULL, NULL, 'seed-attachment-5', 'company', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(6, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, NULL, NULL, 'seed-attachment-6', 'company-update', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(7, 1, 'IMAGE', 'COMPLETED', 'MEMBER', 1, NULL, NULL, 'seed-attachment-7', 'post', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00'),
(8, 7, 'IMAGE', 'COMPLETED', 'MEMBER', 7, 'MEMBER', 7, 'seed-attachment-8', 'avatar', 'jpg', 'image/jpeg', 1024, TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO tasks (id, dtype, start_date, end_date, status, worker_id, project_id, project_title, project_requirement, project_memo, created_at, modified_at) VALUES
(1, 'PROJECT', DATE '2026-06-01', DATE '2026-06-03', 'SCHEDULED', 2, null, '작업', '요구사항', '메모', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO crawled_members (id, company, name, phone, picture, role, brn, email, created_at, modified_at) VALUES
(1, '업체1', '기술자1', '01000000012', NULL, '반장', '123-45-67890', 'crawled1@test.com', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO crawled_profiles (id, member_id, primary_trade, experience, headline, about, address, state, url, platform, created_at, modified_at) VALUES
(1, 1, '방수', 10, '한줄소개1', '소개글1', '주소1', 'SEOUL', 'https://blog.naver.com/crawled1', 'NAVER', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO crawled_profile_trades (profile_id, trade) VALUES
(1, '방수');

INSERT INTO crawled_tasks (id, company, address, trade, start_date, end_date, duration, created_at, modified_at) VALUES
(1, '업체1', '주소1', '방수', DATE '2026-06-01', DATE '2026-06-03', '3일', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO crawled_posts (id, member_id, task_id, title, content, created_at, modified_at) VALUES
(1, 1, 1, '제목1', '내용1', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

INSERT INTO crawled_post_images (post_id, seq, url) VALUES
(1, 0, 'https://example.com/image1.jpg');

INSERT INTO crawled_credentials (id, member_id, type, name, created_at, modified_at) VALUES
(1, 1, 'LICENSE', '면허1', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00');

-- for special entities
ALTER TABLE otps ALTER COLUMN id RESTART WITH 100;
ALTER TABLE signup_tokens ALTER COLUMN id RESTART WITH 100;
ALTER TABLE members ALTER COLUMN id RESTART WITH 100;
ALTER TABLE sessions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE group_chats ALTER COLUMN id RESTART WITH 100;
ALTER TABLE direct_chats ALTER COLUMN id RESTART WITH 100;
ALTER TABLE participants ALTER COLUMN id RESTART WITH 100;
ALTER TABLE messages ALTER COLUMN id RESTART WITH 100;
ALTER TABLE profiles ALTER COLUMN id RESTART WITH 100;
ALTER TABLE tasks ALTER COLUMN id RESTART WITH 100;
ALTER TABLE companies ALTER COLUMN id RESTART WITH 100;
ALTER TABLE projects ALTER COLUMN id RESTART WITH 100;
ALTER TABLE posts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE credentials ALTER COLUMN id RESTART WITH 100;
ALTER TABLE attachments ALTER COLUMN id RESTART WITH 100;
ALTER TABLE coworkers ALTER COLUMN id RESTART WITH 100;
ALTER TABLE coworker_requests ALTER COLUMN id RESTART WITH 100;
ALTER TABLE recommendations ALTER COLUMN id RESTART WITH 100;
ALTER TABLE drives ALTER COLUMN id RESTART WITH 100;
ALTER TABLE boards ALTER COLUMN id RESTART WITH 100;
ALTER TABLE notes ALTER COLUMN id RESTART WITH 100;
ALTER TABLE crawled_members ALTER COLUMN id RESTART WITH 100;
ALTER TABLE crawled_profiles ALTER COLUMN id RESTART WITH 100;
ALTER TABLE crawled_tasks ALTER COLUMN id RESTART WITH 100;
ALTER TABLE crawled_posts ALTER COLUMN id RESTART WITH 100;
ALTER TABLE crawled_credentials ALTER COLUMN id RESTART WITH 100;
