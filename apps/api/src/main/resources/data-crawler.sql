-- 기술자 · 원클릭 크롤링 시드

-- 기술자 크롤링. id 100번대
INSERT INTO crawled_members (id, company, name, phone, picture, role, brn, email, created_at, modified_at) VALUES
(100, '업체1', '기술자1', '01000000012', NULL, '반장', '123-45-67890', 'crawled1@test.com', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_profiles (id, member_id, primary_trade, experience, headline, address, state, url, platform, created_at, modified_at) VALUES
(100, 100, '방수', 10, '한줄소개1', '주소1', '서울', 'https://blog.naver.com/crawled1', 'NAVER', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_profile_trades (profile_id, trade) VALUES
(100, '방수');

INSERT INTO crawled_tasks (id, company, address, trade, start_date, end_date, duration, created_at, modified_at) VALUES
(100, '업체1', '주소1', '방수', DATE '2026-06-01', DATE '2026-06-03', '3일', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_posts (id, member_id, task_id, title, content, created_at, modified_at) VALUES
(100, 100, 100, '제목1', '내용1', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

INSERT INTO crawled_post_images (post_id, seq, url) VALUES
(100, 0, 'https://example.com/image1.jpg');

INSERT INTO crawled_credentials (id, member_id, type, name, created_at, modified_at) VALUES
(100, 100, 'LICENSE', '면허1', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00', TIMESTAMP WITH TIME ZONE '2026-01-01 00:00:00+00');

-- 원클릭 크롤링
INSERT INTO kiscon_registration (ncr_gs_seq, biz_reg_no, company_name, representative, trade_name, trade_reg_no, address, region, region_detail, reg_date, announce_date, flag, phone, announce_number, announce_reason) VALUES
(200, '2001234567', '샘플건설', '김샘플', '실내건축공사업', '서울-실내-200', '서울 강남구 테헤란로 100', '서울', '강남구', 20200101, 20200110, 'Y', '025550200', '서울 강남구공고-제2020-1호', '-'),
(201, '2001234567', '샘플건설', '김샘플', '철근콘크리트공사업', '서울-철콘-201', '서울 강남구 테헤란로 100', '서울', '강남구', 20210301, 20210310, 'Y', '025550200', '서울 강남구공고-제2021-2호', '-');

INSERT INTO kiscon_admin_penalty (ncr_gs_seq, biz_reg_no, company_name, representative, trade_name, trade_reg_no, address, region, region_detail, penalty_type, violation_content, violation_detail, penalty_ground, fine_amount, penalty_amount, stop_start_date, stop_end_date, cancel_date, correction, penalty_date, announce_date, flag, phone, has_injunction, announce_number, announce_reason) VALUES
(210, '2001234567', '샘플건설', '김샘플', '실내건축공사업', '서울-실내-200', '서울 강남구 테헤란로 100', '서울', '강남구', '영업정지', '건설업 등록기준 미달', '자본금 미달', '건설산업기본법 제83조', 0, 0, '20250101', '20250331', NULL, NULL, 20241220, 20241228, 'Y', '025550200', 'N', '서울 공고-제2024-9호', '-');

INSERT INTO kiscon_arrears (id, seq_no, company_name, address, representative, representative_age, representative_address, penalty_history, penalty_dates, arrears_amount, publication_period) VALUES
(200, '1', '체불건설', '서울 서초구 서초대로 200', '박체불', '52', '서울 서초구', '시정명령', '(25.12.15)', '120,000,000', '2026-01-01 ~ 2026-12-31');

INSERT INTO kiscon_subcon_limits (id, seq_no, violation_type, company_name, corp_no, biz_reg_no, representative, restriction_start, restriction_end, category, announcement_date, certificate_url, note) VALUES
(200, '1', '하도급대금 미지급', '체불건설', '1101110000200', '2009876543', '박체불', '20260101', '20261231', '건축', '20251215', NULL, NULL);

INSERT INTO moel_wage_defaults (id, period, name, age, company_name, industry, personal_address, company_address, arrears_amount) VALUES
(200, '2026.01 ~ 2026.12', '박체불', '52', '체불건설', '건설업', '서울 서초구', '서울 서초구 서초대로 200', '85,000,000');

INSERT INTO ecic_electrical_licenses (id, registration_no, company_name, representative, address) VALUES
(200, '서울-2026-200', '샘플건설', '김샘플', '서울 강남구 테헤란로 100');

INSERT INTO feia_fire_licenses (id, seq_no, company_name, ceo_name, address, business_type, license_div, postal_code, phone, region, region_detail) VALUES
(200, 1, '샘플건설', '김샘플', '서울 강남구 테헤란로 100', '공사업', '전문', '06234', '02-555-0200', '서울', '강남구');

INSERT INTO cwma_retirement_fund (id, seq_no, project_name, total_amount, start_date, end_date, company_name, normalized_company_name, client_org, address) VALUES
(200, 1, '샘플 프로젝트 신축공사', 1500000000, DATE '2026-01-01', DATE '2026-12-31', '샘플건설', '샘플건설', '서울특별시', '서울 강남구 테헤란로 100');
