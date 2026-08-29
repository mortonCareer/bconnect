-- 기술자 크롤링 · 원클릭 조회

-- 운영 데이터 (0 ~ 99)
-- 테스트 데이터 (100 ~ 199)
-- 샘플 데이터 (200 ~ 299)
-- 실제 데이터 (1000 ~)

-- 테스트 (100 ~ 199)
-- 기술자 크롤링
INSERT INTO crawled_members (id, company, name, phone, picture, role, brn, email, instagram, youtube, created_at, modified_at) VALUES
(100, '업체1', '기술자1', '01000000012', NULL, '반장', '000-00-00001', 'crawled1@test.com', NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(101, '업체2', '기술자2', '01000000013', NULL, '반장', '000-00-00002', 'crawled2@test.com', NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(102, '업체3', '기술자3', '01000000014', NULL, '팀장', '000-00-00003', 'crawled3@test.com', 'crawled3', NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(103, '업체4', '기술자4', '01000000015', NULL, '반장', '000-00-00004', 'crawled4@test.com', NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(104, '업체5', '기술자5', '01000000016', NULL, '대표', '000-00-00005', 'crawled5@test.com', 'crawled5', NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_profiles (id, member_id, primary_trade, experience, headline, address, state, url, platform, blog_title, profile_image_url, cover_image_url, external_url, created_at, modified_at) VALUES
(100, 100, '방수', 10, '한줄소개', '경기 수원시 장안구 서부로 2066', '경기', 'https://blog.naver.com/crawled1', 'NAVER', '블로그1', NULL, NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(101, 101, '타일', 8, '한줄소개', '경기 수원시 장안구 서부로 2066', '경기', 'https://blog.naver.com/crawled2', 'NAVER', '블로그2', NULL, NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(102, 102, '도장', 12, '한줄소개', '경기 수원시 장안구 서부로 2066', '경기', 'https://www.instagram.com/crawled3', 'INSTAGRAM', NULL, NULL, NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(103, 103, '전기', 15, '한줄소개', '경기 수원시 장안구 서부로 2066', '경기', 'https://blog.naver.com/crawled4', 'NAVER', '블로그4', NULL, NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(104, 104, '목공', 20, '한줄소개', '경기 수원시 장안구 서부로 2066', '경기', 'https://www.instagram.com/crawled5', 'INSTAGRAM', NULL, NULL, NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_profile_trades (profile_id, trade) VALUES
(100, '방수'),
(101, '타일'),
(102, '도장'),
(103, '전기'),
(104, '목공');

INSERT INTO crawled_tasks (id, company, address, trade, start_date, end_date, duration, created_at, modified_at) VALUES
(100, '업체1', '경기 수원시 장안구 서부로 2066', '방수', DATE '2026-06-01', DATE '2026-06-03', '3일', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(101, '업체2', '경기 수원시 장안구 서부로 2066', '타일', DATE '2026-06-04', DATE '2026-06-06', '3일', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(102, '업체3', '경기 수원시 장안구 서부로 2066', '도장', DATE '2026-06-07', DATE '2026-06-11', '5일', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(103, '업체4', '경기 수원시 장안구 서부로 2066', '전기', DATE '2026-06-12', DATE '2026-06-13', '2일', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(104, '업체5', '경기 수원시 장안구 서부로 2066', '목공', DATE '2026-06-14', DATE '2026-06-20', '7일', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_posts (id, member_id, task_id, title, content, source_url, created_at, modified_at) VALUES
(100, 100, 100, '제목', '내용', 'https://blog.naver.com/crawled1/100', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(101, 101, 101, '제목', '내용', 'https://blog.naver.com/crawled2/101', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(102, 102, 102, '제목', '내용', 'https://www.instagram.com/p/crawled3', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(103, 103, 103, '제목', '내용', 'https://blog.naver.com/crawled4/103', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(104, 104, NULL, '제목', '내용', 'https://www.instagram.com/p/crawled5', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_post_images (post_id, seq, url) VALUES
(100, 0, 'https://example.com/image.jpg'),
(101, 0, 'https://example.com/image.jpg'),
(102, 0, 'https://example.com/image.jpg'),
(103, 0, 'https://example.com/image.jpg'),
(104, 0, 'https://example.com/image.jpg');

INSERT INTO crawled_credentials (id, member_id, type, name, created_at, modified_at) VALUES
(100, 100, 'LICENSE', '면허', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(101, 101, 'CERTIFICATE', '자격증', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(102, 102, 'AWARD', '수상', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(103, 103, 'EDUCATION', '교육', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(104, 104, 'LICENSE', '면허', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

-- 샘플 (200 ~ 299)
-- 원클릭 조회
INSERT INTO kiscon_registration (ncr_gs_seq, ncr_master_num, ncr_gs_kname, normalized_company_name, ncr_gs_master, ncr_item_name, ncr_itemregno, ncr_gs_addr, ncr_area_name, ncr_area_detail_name, ncr_gs_date, ncr_gs_regdate, ncr_gs_flag, ncr_off_tel, ncr_gs_number, ncr_gs_reason, synced_at) VALUES
(200, '0000000001', '정상 업체1', '정상 업체1', '대표자', '실내건축공사업', '경기-실내-00001', '경기 수원시 장안구 서부로 2066', '경기', '수원시 장안구', 20260101, 20260101, '신규', '000000001', '공고번호', '-', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00'),
(201, '0000000001', '정상 업체1', '정상 업체1', '대표자', '철근콘크리트공사업', '경기-철콘-00002', '경기 수원시 장안구 서부로 2066', '경기', '수원시 장안구', 20260101, 20260101, '신규', '000000001', '공고번호', '-', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO kiscon_admin_penalty (ncr_gs_seq, ncr_master_num, ncr_admi_kname, normalized_company_name, ncr_admi_master, ncr_item_name, ncr_itemregno, ncr_admi_addr, ncr_area_name, ncr_area_detail_name, ncr_admi_dename, ecode_admi_con, ncr_admi_reason, ecode_admi_ground, ncr_admi_fine, ncr_admi_penalty, ncr_admi_stop_sdate, ncr_admi_stop_edate, ncr_admi_canceldate, ncr_admi_correct, ncr_gs_date, ncr_gs_regdate, ncr_gs_flag, ncr_off_tel, ncr_pd_status, ncr_gs_number, ncr_gs_reason, synced_at) VALUES
(200, '0000000001', '정상 업체1', '정상 업체1', '대표자', '실내건축공사업', '경기-실내-00001', '경기 수원시 장안구 서부로 2066', '경기', '수원시 장안구', '영업정지', '건설업 등록기준 미달', '자본금 미달', '건설산업기본법 제83조', 0, 0, '20260101', '20261231', '-', '-', 20260101, 20260101, '신규', '000000001', 'N', '공고번호', '-', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO kiscon_arrears (id, seq_no, company_name, normalized_company_name, address, representative, representative_age, representative_address, penalty_history, penalty_dates, arrears_amount, publication_period, synced_at) VALUES
(200, '1', '체불 업체1', '체불 업체1', '경기 수원시 장안구 서부로 2066', '대표자', '52', '경기 수원시 장안구', '시정명령', '(26.01.01)', '120,000', '2026-01-01 ~ 2026-12-31', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO kiscon_subcon_limits (id, seq_no, violation_type, company_name, normalized_company_name, corp_no, biz_reg_no, representative, restriction_start, restriction_end, category, announcement_date, certificate_url, note, synced_at) VALUES
(200, '1', '건설산업기본법 제82조', '체불 업체1', '체불 업체1', '0000000000001', '0000000002', '대표자', '20260101', '20261231', '건축', '20260101', NULL, NULL, TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO moel_wage_defaults (id, period, name, age, company_name, normalized_company_name, industry, personal_address, company_address, arrears_amount, synced_at) VALUES
(200, '2026.01 ~ 2026.12', '대표자', '52', '체불 업체1', '체불 업체1', '건설업', '경기 수원시 장안구', '경기 수원시 장안구 서부로 2066', '85,000,000', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO ecic_electrical_licenses (id, registration_no, company_name, normalized_company_name, representative, address, synced_at) VALUES
(200, '경기-2026-00001', '정상 업체1', '정상 업체1', '대표자', '경기 수원시 장안구 서부로 2066', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO cwma_retirement_fund (id, seq_no, project_name, total_amount, start_date, end_date, company_name, normalized_company_name, client_org, address, synced_at) VALUES
(200, 1, '프로젝트', 15, DATE '2026-01-01', DATE '2026-12-31', '정상 업체1', '정상 업체1', '기관명', '경기 수원시 장안구 서부로 2066', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO feia_fire_licenses (id, seq_no, company_name, normalized_company_name, ceo_name, address, business_type, license_div, postal_code, phone, region, region_detail, synced_at) VALUES
(200, 1, '정상 업체1', '정상 업체1', '대표자', '경기 수원시 장안구 서부로 2066', '공사업', '전문', '16419', '00-000-0001', '경기', '수원시 장안구', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

-- 실데이터 (1000 ~)
ALTER TABLE crawled_members ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE crawled_profiles ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE crawled_credentials ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE crawled_tasks ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE crawled_posts ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE kiscon_subcon_limits ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE kiscon_arrears ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE moel_wage_defaults ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE ecic_electrical_licenses ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE feia_fire_licenses ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE cwma_retirement_fund ALTER COLUMN id RESTART WITH 1000;
