"""기술자 크롤링 파이프라인 — 검색 → 파싱 → 분류 → 중복체크 → 노션 저장."""

import asyncio
import logging
from pathlib import Path

from crawler.channels.naver_blog import search_blogs, search_local, explore_blogger, build_search_queries, extract_blog_id, extract_contact_info
from crawler.channels.instagram import (
    search_instagram, explore_profile as explore_instagram_profile,
    build_search_queries as build_instagram_queries, extract_username as extract_instagram_username,
    InstagramBlockedError, reset_block_counter,
)
from crawler.classifier import classify, format_phone, infer_region_from_address, METRO_REGIONS
from crawler.classifier_rules import rule_reject
from crawler.config import settings
from crawler.models import (
    CrawledMember, CrawledPost, CrawledProfile,
    PLATFORM_INSTAGRAM, PLATFORM_NAVER, REGION_ENUM_BY_KR, phone_digits, trade_enum,
)
from crawler.notion import (
    save_member, save_to_review, update_member,
    find_duplicate_by_url, touch_synced_at,
    find_pages_needing_enrichment, find_approved, move_to_production,
    validate_schema, validate_review_schema,
    find_all_review_pages, patch_review_page, read_page_blocks, update_block_text,
    _read_prop,
)
from crawler.report import PipelineReport
from crawler.progress import create_progress, print_summary, console

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

REPORTS_DIR = Path("reports")

# 동시 처리 제한: 네이버 스크래핑 + LLM + 노션 API 동시 요청 수
CONCURRENCY = 3
# --full 모드에서 동시에 실행할 쿼리 수
QUERY_CONCURRENCY = 1
# 인스타그램 동시 요청 수 (로그인 없이 제한 엄격)
INSTA_CONCURRENCY = 3


def setup_file_logging() -> None:
    """reports/ 디렉토리에 파일 로거를 추가한다.

    콘솔 로그가 억제돼도 디버그 로그가 파일에 보존된다.
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    from datetime import datetime, timezone

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    handler = logging.FileHandler(REPORTS_DIR / f"{stamp}.log", encoding="utf-8")
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    logging.getLogger().addHandler(handler)


async def process_blog_result(
    item: dict,
    seen_blog_ids: set[str] | None = None,
    report: PipelineReport | None = None,
    dry_run: bool = False,
    force: bool = False,
    direct: bool = False,
    metro_only: bool = False,
    skip_vision: bool = False,
) -> CrawledMember | None:
    """검색 결과 1건 → 수집 → 분류 → CrawledMember 생성."""
    raw = await _scrape_blog_result(item, seen_blog_ids, report, dry_run, force, direct)
    if raw is None:
        return None
    return await _classify_scraped(
        raw["blog_url"], raw["blogger_name"], raw["profile"],
        report=report, metro_only=metro_only, skip_vision=skip_vision,
    )


async def _scrape_blog_result(
    item: dict,
    seen_blog_ids: set[str] | None = None,
    report: PipelineReport | None = None,
    dry_run: bool = False,
    force: bool = False,
    direct: bool = False,
) -> dict | None:
    """검색 결과 1건 → 중복 체크 → 블로그 수집. 분류는 하지 않는다.

    수집한 원본 {blog_url, blogger_name, profile}을 반환한다. 걸러내는 것 없이
    수집만 하므로 이 결과를 저장해두면 분류만 따로 재실행할 수 있다(#920).
    """
    blog_url = item["link"]
    blogger_name = item.get("bloggername", "")

    blog_id = extract_blog_id(blog_url)

    # 메모리 중복 체크: 같은 실행 내 이미 처리한 blog_id는 즉시 스킵
    # force 모드에서도 같은 실행 내 중복은 스킵 (무한루프 방지)
    if blog_id and seen_blog_ids is not None and blog_id in seen_blog_ids:
        log.info("이미 처리됨 (메모리), 건너뜀: %s (%s)", blogger_name, blog_id)
        if report:
            report.add_skipped(blog_url, blogger_name, "메모리 중복")
        return None

    # 노션 DB 중복 체크: 크롤링/LLM 전에 URL로 스킵 (비용 절약)
    # dry_run 모드에서는 노션 조회 자체를 건너뜀
    # force 모드에서는 중복이 있어도 스킵하지 않고 재크롤링
    # 검수 모드(direct=False)에서는 프로덕션 DB 중복과 무관하게 검수 DB에 저장
    if blog_id and not dry_run and not force and direct:
        detail_url = f"https://blog.naver.com/{blog_id}"
        existing = await find_duplicate_by_url(detail_url)
        if existing:
            await touch_synced_at(existing)
            if seen_blog_ids is not None:
                seen_blog_ids.add(blog_id)
            log.info("이미 등록됨, 싱크 시점 갱신: %s (%s)", blogger_name, blog_id)
            if report:
                report.add_synced(blog_url, blogger_name)
            return None

    # 병렬 처리 시 같은 blog_id 이중 진입 방지: 탐색 전에 선점
    if blog_id and seen_blog_ids is not None:
        seen_blog_ids.add(blog_id)

    log.info("탐색 중: %s (%s)", blogger_name, blog_url)

    try:
        profile = await explore_blogger(blog_url)
    except Exception as exc:
        log.warning("탐색 실패: %s", blog_url, exc_info=True)
        if report:
            report.add_failed(blog_url, blogger_name, "탐색", str(exc))
        return None

    profile_intro = profile.get("profile_intro", "")
    if not profile["about"] and not profile_intro:
        log.info("본문 없음, 건너뜀: %s", blog_url)
        if report:
            report.add_skipped(blog_url, blogger_name, "본문 없음")
        return None

    return {"blog_url": blog_url, "blogger_name": blogger_name, "profile": profile}


async def _classify_scraped(
    blog_url: str,
    blogger_name: str,
    profile: dict,
    report: PipelineReport | None = None,
    metro_only: bool = False,
    skip_vision: bool = False,
) -> CrawledMember | None:
    """수집해둔 블로그 원본(profile) 1건을 분류하여 CrawledMember 생성.

    원본만 있으면 재실행 가능 — 분류 방법을 바꿔도 다시 수집할 필요 없음(#920).
    """
    profile_intro = profile.get("profile_intro", "")

    # 값싼 규칙 선필터: 확실한 비-기술자(자동차·인력사무소·협찬글 등)는 LLM 없이 즉시 제외 (#915)
    rejected = rule_reject({
        "company": profile.get("blog_title", ""),
        "headline": profile_intro,
        "about": profile["about"],
    })
    if rejected:
        _, reason = rejected
        log.info("규칙 제외(%s): %s (%s)", reason, blogger_name, blog_url)
        if report:
            report.add_skipped(blog_url, blogger_name, f"규칙:{reason}")
        return None

    # LLM 분류: 프로필 소개 + 게시글 본문을 종합하여 분류
    combined_about = ""
    if profile_intro:
        combined_about += f"[블로그 프로필 소개]\n{profile_intro}\n\n"
    combined_about += f"[게시글 본문]\n{profile['about']}"

    try:
        classification, usage = await classify(
            name=blogger_name,
            about=combined_about,
            headline=profile.get("blog_title", ""),
        )
        if report:
            report.add_llm_usage(usage["input_tokens"], usage["output_tokens"])
    except Exception as exc:
        log.warning("분류 실패: %s", blog_url, exc_info=True)
        if report:
            report.add_failed(blog_url, blogger_name, "분류", str(exc))
        return None

    # 전문업자 필터: 일반인/DIY 블로거 스킵
    if not classification.get("is_professional", True):
        log.info("비전문업자, 건너뜀: %s (%s)", blogger_name, blog_url)
        if report:
            report.add_skipped(blog_url, blogger_name, "비전문업자")
        return None

    # 수도권 필터: --full 모드에서 비수도권 결과 스킵
    region = classification.get("region", "")
    if metro_only and region and region not in METRO_REGIONS:
        log.info("비수도권, 건너뜀: %s (%s, 지역=%s)", blogger_name, blog_url, region)
        if report:
            report.add_skipped(blog_url, blogger_name, f"비수도권({region})")
        return None

    # 업체명: classify 결과 → blog_title → blogger_name 순 폴백
    name = (
        classification.get("name")
        or profile.get("blog_title")
        or profile.get("blogger_name")
        or blogger_name
    )

    # 커버 이미지: 메인 배너 → 프로필 이미지 → 게시글 og:image 순 폴백
    cover_image_url = (
        profile.get("banner_image_url")
        or profile.get("profile_image_url")
        or profile.get("cover_image_url", "")
    )

    # 자세히보기: 블로그 홈 → 게시글 URL 순 폴백
    detail_url = profile.get("blog_home_url") or blog_url

    # 연락처: 프로필 소개글 출처면 신뢰, 게시글 출처면 LLM 우선
    phone_source = profile.get("phone_source", "")
    regex_phone = profile.get("phone", "")
    llm_phone = classification.get("phone", "")
    if phone_source == "profile":
        phone = regex_phone  # 프로필 소개글 → 본인 번호, 신뢰
    else:
        phone = llm_phone or regex_phone  # LLM 판별 우선, 없으면 정규식 폴백

    # 이메일: LLM → 정규식 폴백
    email = classification.get("email", "") or profile.get("email", "")
    address = classification.get("address", "")

    # 네이버 지역검색으로 부족한 필드 보충
    if name and (not phone or not address):
        place = await search_local(name)
        if place:
            if not phone and place["telephone"]:
                raw = place["telephone"].replace("-", "").replace(" ", "")
                if raw.startswith("0"):
                    phone = format_phone(raw)
                    log.info("지역검색 연락처 보충: %s → %s", name, phone)
            if not address and (place["road_address"] or place["address"]):
                address = place["road_address"] or place["address"]
                log.info("지역검색 주소 보충: %s → %s", name, address)

    # 스킨 이미지 Vision 보충: 배너 → Footer 순으로 부족한 정보 채우기
    skin_urls = [
        ("배너", profile.get("banner_image_url", "")),
        ("Footer", profile.get("footer_image_url", "")),
    ]
    if not skip_vision and (not phone or not classification.get("business_number")):
        from crawler.classifier import extract_text_from_image
        for label, img_url in skin_urls:
            if not img_url:
                continue
            try:
                vision_data, vision_usage = await extract_text_from_image(img_url)
                if report:
                    report.add_llm_usage(vision_usage["input_tokens"], vision_usage["output_tokens"])
                if not phone and vision_data.get("phone"):
                    phone = vision_data["phone"]
                    log.info("Vision(%s) 연락처 보충: %s → %s", label, name, phone)
                if not email and vision_data.get("email"):
                    email = vision_data["email"]
                if not classification.get("business_number") and vision_data.get("business_number"):
                    classification["business_number"] = vision_data["business_number"]
                if not classification.get("representative") and vision_data.get("representative"):
                    classification["representative"] = vision_data["representative"]
                if not address and vision_data.get("address"):
                    address = vision_data["address"]
            except Exception:
                log.warning("Vision(%s) 추출 실패: %s", label, img_url, exc_info=True)
            # 이미 핵심 정보(전화, 사업자번호) 모두 확보되면 중단
            if phone and classification.get("business_number"):
                break

    # 네이버 인증 사업자정보 — 1순위 덮어쓰기 (인증 데이터)
    biz = profile.get("business_info") or {}
    if biz:
        if biz.get("phone"):
            phone = biz["phone"]
        if biz.get("email"):
            email = biz["email"]
        if biz.get("address"):
            address = biz["address"]
        if biz.get("business_name"):
            name = biz["business_name"]
        if biz.get("representative"):
            classification["representative"] = biz["representative"]
        if biz.get("business_number"):
            classification["business_number"] = biz["business_number"]

    # 지역 보정: 주소에서 추론한 지역이 LLM 결과와 다르면 주소 기반으로 교체
    region = classification.get("region", "")
    if address:
        addr_region = infer_region_from_address(address)
        if addr_region and addr_region != region:
            log.info("지역 보정: %s → %s (주소: %s)", region or "(없음)", addr_region, address[:30])
            region = addr_region

    trades = classification["trades"]
    # 한국어 라벨 → BE Trade enum 코드 (미대응 "기타" 등은 드랍)
    enum_trades = [c for t in trades if (c := trade_enum(t))]
    member = CrawledMember(
        company=name,
        name=classification.get("representative", ""),
        phone=phone_digits(phone),
        picture=cover_image_url,
        role=classification["rank"],
        brn=classification.get("business_number", ""),
        email=email,
        profile=CrawledProfile(
            primary_trade=enum_trades[0] if enum_trades else "",
            trades=enum_trades,
            experience=classification.get("experience"),
            headline=profile_intro[:500],
            about=profile["about"][:2000],
            address=address,
            state=REGION_ENUM_BY_KR.get(region, ""),
            url=detail_url,
            platform=PLATFORM_NAVER,
        ),
        posts=[CrawledPost(**post) for post in profile.get("posts", [])],
        source_urls=profile["source_urls"],
    )

    return member


async def process_instagram_result(
    item: dict,
    seen_usernames: set[str] | None = None,
    report: PipelineReport | None = None,
    dry_run: bool = False,
    force: bool = False,
    on_status: object = None,
) -> CrawledMember | None:
    """인스타그램 검색 결과 1건 → 프로필 탐색 → 분류 → CrawledMember 생성."""
    link = item["link"]
    username = item.get("username") or extract_instagram_username(link)

    if not username:
        log.info("인스타 사용자명 추출 실패, 건너뜀: %s", link)
        if report:
            report.add_skipped(link, "", "사용자명 없음")
        return None

    # 메모리 중복 체크
    if seen_usernames is not None and username in seen_usernames:
        log.info("이미 처리됨 (메모리), 건너뜀: %s", username)
        if report:
            report.add_skipped(link, username, "메모리 중복")
        return None

    # 노션 DB 중복 체크
    instagram_url = f"https://www.instagram.com/{username}/"
    if not dry_run and not force:
        existing = await find_duplicate_by_url(instagram_url)
        if existing:
            await touch_synced_at(existing)
            if seen_usernames is not None:
                seen_usernames.add(username)
            log.info("이미 등록됨, 싱크 시점 갱신: %s", username)
            if report:
                report.add_synced(link, username)
            return None

    # 선점
    if seen_usernames is not None:
        seen_usernames.add(username)

    # 1단계: 네이버 스니펫에서 파싱된 데이터 확인
    snippet_bio = item.get("bio", "")
    snippet_name = item.get("full_name", "")

    if snippet_bio:
        # 스니펫만으로 충분 — Instagram 직접 접근 스킵
        log.info("스니펫 데이터 사용 (탐색 스킵): %s", username)
        if on_status:
            on_status(f"스니펫: @{username}")
        contact = extract_contact_info(snippet_bio)
        profile = {
            "about": f"[프로필 소개]\n{snippet_bio}",
            "headline": snippet_bio[:500],
            "full_name": snippet_name,
            "profile_pic_url": "",
            "source_urls": [instagram_url],
            "phone": contact["phone"],
            "email": contact["email"],
        }
    else:
        # 스니펫 부족 — Instagram 프로필 직접 접근
        log.info("인스타 탐색 중: %s", username)
        if on_status:
            on_status(f"탐색: @{username}")
        try:
            profile = await explore_instagram_profile(username)
        except InstagramBlockedError:
            raise
        except Exception as exc:
            log.warning("인스타 탐색 실패: %s", username, exc_info=True)
            if report:
                report.add_failed(link, username, "탐색", str(exc))
            return None

    if not profile["about"] and not profile["headline"]:
        log.info("프로필 정보 없음, 건너뜀: %s", username)
        if report:
            report.add_skipped(link, username, "프로필 정보 없음")
        return None

    # 검색 결과 컨텍스트 보충
    about = profile["about"]
    search_title = item.get("title", "")
    search_desc = item.get("description", "")
    if search_title or search_desc:
        about += f"\n\n[검색 결과]\n{search_title}\n{search_desc}"

    # LLM 분류
    if on_status:
        on_status(f"분류: @{username}")
    try:
        classification, usage = await classify(
            name=profile.get("full_name", "") or username,
            about=about,
            headline=profile.get("headline", ""),
        )
        if report:
            report.add_llm_usage(usage["input_tokens"], usage["output_tokens"])
    except Exception as exc:
        log.warning("분류 실패: %s", username, exc_info=True)
        if report:
            report.add_failed(link, username, "분류", str(exc))
        return None

    # 전문업자 필터: 일반인/DIY 블로거 스킵
    if not classification.get("is_professional", True):
        log.info("비전문업자, 건너뜀: %s (%s)", username, link)
        if report:
            report.add_skipped(link, username, "비전문업자")
        return None

    name = classification.get("name") or profile.get("full_name") or username

    # 연락처: bio regex → LLM → search_local 보충
    phone = classification.get("phone", "") or profile.get("phone", "")
    email = classification.get("email", "") or profile.get("email", "")
    address = classification.get("address", "")

    if name and (not phone or not address):
        place = await search_local(name)
        if place:
            if not phone and place["telephone"]:
                raw = place["telephone"].replace("-", "").replace(" ", "")
                if raw.startswith("0"):
                    phone = format_phone(raw)
                    log.info("지역검색 연락처 보충: %s → %s", name, phone)
            if not address and (place["road_address"] or place["address"]):
                address = place["road_address"] or place["address"]
                log.info("지역검색 주소 보충: %s → %s", name, address)

    trades = classification["trades"]
    # 한국어 라벨 → BE Trade enum 코드 (미대응 "기타" 등은 드랍)
    enum_trades = [c for t in trades if (c := trade_enum(t))]
    member = CrawledMember(
        company=name,
        name=classification.get("representative", ""),
        phone=phone_digits(phone),
        picture=profile.get("profile_pic_url", ""),
        role=classification["rank"],
        brn=classification.get("business_number", ""),
        email=email,
        profile=CrawledProfile(
            primary_trade=enum_trades[0] if enum_trades else "",
            trades=enum_trades,
            experience=classification.get("experience"),
            headline=profile["headline"][:500],
            about=profile["about"][:2000],
            address=address,
            state=REGION_ENUM_BY_KR.get(classification.get("region", ""), ""),
            url=instagram_url,
            platform=PLATFORM_INSTAGRAM,
        ),
        source_urls=profile["source_urls"],
    )

    return member


async def run_pipeline(
    query: str, count: int = 10, seen_blog_ids: set[str] | None = None,
    report: PipelineReport | None = None, dry_run: bool = False,
    force: bool = False, direct: bool = False, metro_only: bool = False,
    skip_vision: bool = False,
) -> list[str]:
    """단일 검색어로 파이프라인을 실행한다.

    Args:
        query: 네이버 검색 쿼리
        count: 수집할 결과 수
        seen_blog_ids: 실행 내 이미 처리한 blog_id (쿼리 간 공유)
        report: 실행 보고서 누적기
        dry_run: True면 노션 저장을 건너뛰고 분류까지만 수행
        force: True면 이미 등록된 업체도 재크롤링하여 덮어쓴다

    Returns:
        저장된 노션 page_id 목록 (dry_run 시 빈 리스트)
    """
    if seen_blog_ids is None:
        seen_blog_ids = set()

    if report:
        report.queries.append(query)

    items = await _search_blogs_paged(query, count)

    if report:
        report.total_searched += len(items)

    sem = asyncio.Semaphore(CONCURRENCY)
    saved_ids: list[str] = []

    async def _handle(item: dict) -> None:
        async with sem:
            member = await process_blog_result(item, seen_blog_ids=seen_blog_ids, report=report, dry_run=dry_run, force=force, direct=direct, metro_only=metro_only, skip_vision=skip_vision)
        if member is None:
            return

        blog_url = item["link"]
        blogger_name = item.get("bloggername", "")
        image_count = sum(len(post.images) for post in member.posts)

        if dry_run:
            log.info("dry-run: %s (저장 건너뜀)", member.company)
            if report:
                report.members.append(member.dump())
                report.add_saved(
                    blog_url=blog_url, blogger_name=blogger_name,
                    company=member.company, role=member.role, trades=member.profile.trades,
                    phone=member.phone, page_id="",
                    region=member.region_kr, address=member.profile.address, email=member.email,
                    posts=len(member.posts), images=image_count,
                )
            return

        try:
            if direct:
                page_id = await save_member(member, force=force)
            else:
                page_id = await save_to_review(member)
        except Exception as exc:
            log.warning("저장 실패: %s", blog_url, exc_info=True)
            if report:
                report.add_failed(blog_url, blogger_name, "저장", str(exc))
            return

        log.info("저장 완료: %s → %s", member.company, page_id)
        saved_ids.append(page_id)
        if report:
            report.add_saved(
                blog_url=blog_url, blogger_name=blogger_name,
                company=member.company, role=member.role, trades=member.profile.trades,
                phone=member.phone, page_id=page_id,
                region=member.region_kr, address=member.profile.address, email=member.email,
                posts=len(member.posts), images=image_count,
            )

    await asyncio.gather(*[_handle(item) for item in items])

    log.info("파이프라인 완료: %d/%d건 저장", len(saved_ids), len(items))
    return saved_ids


async def run_full(keywords: list[str] | None = None, per_query: int = 5, dry_run: bool = False, force: bool = False, direct: bool = False, use_vision: bool = False) -> PipelineReport:
    """전체 키워드로 파이프라인을 실행한다.

    쿼리를 QUERY_CONCURRENCY개씩 병렬 실행하여 전체 소요 시간을 단축한다.
    개별 쿼리 실패 시 최대 2회 재시도하고, 그래도 실패하면 건너뛴다.
    """
    queries = build_search_queries(keywords)

    report = PipelineReport()
    report.mode = "전체 키워드"
    report.per_query = per_query
    report.llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model

    seen_blog_ids: set[str] = set()
    completed = 0
    query_sem = asyncio.Semaphore(QUERY_CONCURRENCY)

    async def _run_query(q: str) -> None:
        nonlocal completed
        async with query_sem:
            for attempt in range(3):
                try:
                    await run_pipeline(
                        q, count=per_query, seen_blog_ids=seen_blog_ids,
                        report=report, dry_run=dry_run, force=force, direct=direct,
                        metro_only=True, skip_vision=not use_vision,
                    )
                    break
                except Exception as exc:
                    if attempt < 2:
                        wait = 2 ** attempt
                        log.warning("쿼리 실패 '%s' (%s), %d초 후 재시도 (%d/3)", q, exc, wait, attempt + 1)
                        await asyncio.sleep(wait)
                    else:
                        log.error("쿼리 포기 '%s': %s", q, exc)
                        report.add_failed("", "", "쿼리", f"{q}: {exc}")
            completed += 1
            progress.update(task_all, completed=completed)

    progress = create_progress()
    with progress:
        task_all = progress.add_task(
            f"전체 ({len(queries)} 쿼리)", total=len(queries),
        )
        await asyncio.gather(*[_run_query(q) for q in queries])

    return report


async def _search_blogs_paged(query: str, count: int) -> list[dict]:
    """네이버 블로그 검색(display 최대 100)을 페이지네이션해 count건까지 모은다."""
    log.info("검색 시작: '%s' (최대 %d건)", query, count)
    items: list[dict] = []
    page_size = min(count, 100)
    start = 1
    while len(items) < count:
        page = await search_blogs(query, display=page_size, start=start)
        if not page:
            break
        items.extend(page)
        start += len(page)
        if len(page) < page_size:
            break
    items = items[:count]
    log.info("검색 결과: %d건", len(items))
    return items


async def run_collect_raw(
    keywords: list[str] | None = None, per_query: int = 5,
    force: bool = False, out: Path | None = None, dedup: bool = True,
) -> PipelineReport:
    """#920 1단계 — 검색 → 수집 → 원본을 파일에 저장. 분류·저장은 하지 않는다.

    걸러내는 것 없이 수집한 것을 전부 남기므로, 이후 분류 방법이 바뀌어도
    다시 수집하지 않고 `--classify-from-raw`로 분류만 재실행할 수 있다.

    dedup(기본 켜짐): 이미 DB에 적재됐거나 이전 원본 파일에 있는 블로그는 다시
    수집하지 않는다. 같은 키워드로 다시 돌려도 새 블로그만 쌓인다.
    """
    from crawler import raw_store

    queries = build_search_queries(keywords)
    path = out or raw_store.raw_path("naver")

    report = PipelineReport()
    report.mode = "원본 수집(raw)"
    report.per_query = per_query

    seen_blog_ids: set[str] = set()
    if dedup:
        seen_urls: set[str] = set()
        # 이전에 수집한 원본 파일들
        for prev in raw_store.RAW_DIR.glob("*.jsonl"):
            try:
                seen_urls |= {r["blog_url"] for r in raw_store.load_raw(prev)}
            except Exception:
                pass
        # 이미 DB에 적재된 것
        if settings.crawled_db_url:
            try:
                from crawler.db import load_existing_urls
                seen_urls |= await load_existing_urls(settings.crawled_db_url)
            except Exception as exc:
                log.warning("DB 중복목록 조회 실패(무시하고 진행): %s", exc)
        seen_blog_ids = {b for u in seen_urls if (b := extract_blog_id(u))}
        log.info("중복 제외 대상 블로그 %d개 (이미 수집/적재됨)", len(seen_blog_ids))
    query_sem = asyncio.Semaphore(QUERY_CONCURRENCY)
    write_lock = asyncio.Lock()
    collected = 0

    async def _collect_query(q: str) -> None:
        nonlocal collected
        report.queries.append(q)
        items = await _search_blogs_paged(q, per_query)
        report.total_searched += len(items)
        sem = asyncio.Semaphore(CONCURRENCY)

        async def _one(item: dict) -> None:
            nonlocal collected
            async with sem:
                # dry_run=True: 노션 중복조회 건너뜀(수집만 수행). direct=False.
                raw = await _scrape_blog_result(
                    item, seen_blog_ids=seen_blog_ids, report=report,
                    dry_run=True, force=force, direct=False,
                )
            if raw is None:
                return
            async with write_lock:
                raw_store.append_raw(path, raw)
            collected += 1

        await asyncio.gather(*[_one(it) for it in items])

    async def _guarded(q: str) -> None:
        async with query_sem:
            try:
                await _collect_query(q)
            except Exception as exc:
                log.error("쿼리 수집 실패 '%s': %s", q, exc)
                report.add_failed("", "", "쿼리", f"{q}: {exc}")

    await asyncio.gather(*[_guarded(q) for q in queries])
    console.print(f"[green]원본 {collected}건 저장 → {path}[/green]")
    return report


async def run_classify_from_raw(
    raw_file: Path, metro_only: bool = False, skip_vision: bool = False,
) -> PipelineReport:
    """#920 2단계 — 저장된 원본을 읽어 분류만 실행한다. 다시 수집하지 않는다.

    dry-run과 같은 형태의 보고서(members 포함)를 만들어, 기존 `--export-db`로
    그대로 DB에 적재할 수 있다. 분류 방법을 바꿔 재실행할 땐 이 명령만 돌리면 된다.
    """
    from crawler import raw_store

    raws = raw_store.load_raw(raw_file)
    report = PipelineReport()
    report.mode = "원본에서 분류(classify-from-raw)"
    report.llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model
    report.total_searched = len(raws)
    log.info("원본 %d건 분류 시작: %s", len(raws), raw_file)

    sem = asyncio.Semaphore(CONCURRENCY)

    async def _one(raw: dict) -> None:
        async with sem:
            member = await _classify_scraped(
                raw["blog_url"], raw["blogger_name"], raw["profile"],
                report=report, metro_only=metro_only, skip_vision=skip_vision,
            )
        if member is None:
            return
        image_count = sum(len(post.images) for post in member.posts)
        report.members.append(member.dump())
        report.add_saved(
            blog_url=raw["blog_url"], blogger_name=raw.get("blogger_name", ""),
            company=member.company, role=member.role, trades=member.profile.trades,
            phone=member.phone, page_id="",
            region=member.region_kr, address=member.profile.address, email=member.email,
            posts=len(member.posts), images=image_count,
        )

    await asyncio.gather(*[_one(r) for r in raws])
    log.info("분류 완료: %d/%d건 기술자로 통과", len(report.members), len(raws))
    return report


async def run_instagram_pipeline(
    query: str, count: int = 10, seen_usernames: set[str] | None = None,
    report: PipelineReport | None = None, dry_run: bool = False,
    force: bool = False, on_status: object = None, direct: bool = False,
) -> list[str]:
    """단일 검색어로 인스타그램 파이프라인을 실행한다."""
    if seen_usernames is None:
        seen_usernames = set()

    if report:
        report.queries.append(query)

    log.info("인스타 검색 시작: '%s' (최대 %d건)", query, count)
    items: list[dict] = []
    page_size = min(count, 100)
    start = 1
    while len(items) < count:
        page = await search_instagram(query, display=page_size, start=start)
        if not page:
            break
        items.extend(page)
        start += len(page)
        if len(page) < page_size:
            break
    items = items[:count]
    log.info("인스타 검색 결과: %d건", len(items))

    if report:
        report.total_searched += len(items)

    sem = asyncio.Semaphore(INSTA_CONCURRENCY)
    saved_ids: list[str] = []
    _blocked = False

    async def _handle(item: dict) -> None:
        nonlocal _blocked
        if _blocked:
            return
        try:
            async with sem:
                member = await process_instagram_result(
                    item, seen_usernames=seen_usernames, report=report,
                    dry_run=dry_run, force=force, on_status=on_status,
                )
        except InstagramBlockedError:
            _blocked = True
            raise
        if member is None:
            return

        link = item["link"]
        username = item.get("username", "")

        if dry_run:
            log.info("dry-run: %s (저장 건너뜀)", member.company)
            if report:
                report.members.append(member.dump())
                report.add_saved(
                    blog_url=link, blogger_name=username,
                    company=member.company, role=member.role, trades=member.profile.trades,
                    phone=member.phone, page_id="",
                    region=member.region_kr, address=member.profile.address, email=member.email,
                )
            return

        if on_status:
            on_status(f"저장: {member.company[:15]}")
        try:
            if direct:
                page_id = await save_member(member, force=force)
            else:
                page_id = await save_to_review(member)
        except Exception as exc:
            log.warning("저장 실패: %s", link, exc_info=True)
            if report:
                report.add_failed(link, username, "저장", str(exc))
            return

        log.info("저장 완료: %s → %s", member.company, page_id)
        saved_ids.append(page_id)
        if report:
            report.add_saved(
                blog_url=link, blogger_name=username,
                company=member.company, role=member.role, trades=member.profile.trades,
                phone=member.phone, page_id=page_id,
                region=member.region_kr, address=member.profile.address, email=member.email,
            )

    await asyncio.gather(*[_handle(item) for item in items])

    log.info("인스타 파이프라인 완료: %d/%d건 저장", len(saved_ids), len(items))
    return saved_ids


async def run_instagram_full(
    keywords: list[str] | None = None, per_query: int = 5,
    dry_run: bool = False, force: bool = False, direct: bool = False,
) -> PipelineReport:
    """전체 키워드로 인스타그램 파이프라인을 실행한다."""
    queries = build_instagram_queries(keywords)
    reset_block_counter()

    report = PipelineReport()
    report.mode = "인스타그램 전체 키워드"
    report.per_query = per_query
    report.llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model

    seen_usernames: set[str] = set()
    completed = 0
    blocked = False
    query_sem = asyncio.Semaphore(QUERY_CONCURRENCY)

    progress = create_progress()

    async def _run_query(q: str) -> None:
        nonlocal completed, blocked
        if blocked:
            completed += 1
            progress.update(task_all, completed=completed)
            return
        async with query_sem:
            for attempt in range(3):
                try:
                    await run_instagram_pipeline(
                        q, count=per_query, seen_usernames=seen_usernames,
                        report=report, dry_run=dry_run, force=force,
                        on_status=lambda text: progress.update(task_status, description=text),
                        direct=direct,
                    )
                    break
                except InstagramBlockedError as exc:
                    blocked = True
                    log.error("Instagram 차단 감지 — 파이프라인 중단: %s", exc)
                    progress.update(task_status, description="[red]차단 감지 — 중단[/red]")
                    report.add_failed("", "", "차단", str(exc))
                    break
                except Exception as exc:
                    if attempt < 2:
                        wait = 2 ** attempt
                        log.warning("인스타 쿼리 실패 '%s' (%s), %d초 후 재시도 (%d/3)", q, exc, wait, attempt + 1)
                        await asyncio.sleep(wait)
                    else:
                        log.error("인스타 쿼리 포기 '%s': %s", q, exc)
                        report.add_failed("", "", "쿼리", f"{q}: {exc}")
            completed += 1
            progress.update(task_all, completed=completed)

    with progress:
        task_all = progress.add_task(
            f"인스타그램 ({len(queries)} 쿼리)", total=len(queries),
        )
        task_status = progress.add_task("대기 중...", total=None)
        await asyncio.gather(*[_run_query(q) for q in queries])
        progress.update(task_status, description="완료", visible=False)

    return report


async def run_export_db(file_path: Path, truncate: bool = False) -> PipelineReport:
    """dry-run 보고서 JSON(members[])을 crawled_* DB 테이블에 적재한다 (#876).

    ⚠️ BE 우회 — crawled_* 직접 INSERT. 대상 DB 는 CRAWLED_DB_URL 환경변수.
    """
    import json

    from crawler.db import export_members

    if not settings.crawled_db_url:
        raise ValueError("CRAWLED_DB_URL 환경변수가 설정되지 않았습니다")

    data = json.loads(file_path.read_text(encoding="utf-8"))
    members_data = data.get("members", [])
    if not members_data:
        raise ValueError(f"파일에 members 데이터가 없습니다: {file_path}")

    members = [CrawledMember.model_validate(m) for m in members_data]
    log.info("DB 적재: %s (%d건)%s", file_path, len(members), " [truncate]" if truncate else "")

    created, updated = await export_members(members, settings.crawled_db_url, truncate=truncate)

    report = PipelineReport()
    report.mode = "DB 적재"
    report.total_searched = len(members)
    for m in members:
        report.add_saved(
            blog_url=m.profile.url, blogger_name=m.company,
            company=m.company, role=m.role, trades=m.profile.trades,
            phone=m.phone, page_id="",
            region=m.region_kr, address=m.profile.address, email=m.email,
            posts=len(m.posts), images=sum(len(p.images) for p in m.posts),
        )
    log.info("DB 적재 완료: 신규 %d · 갱신 %d", created, updated)
    console.print(f"[green]DB 적재 완료: 신규 {created} · 갱신 {updated}[/green]")
    return report


async def run_from_file(file_path: Path, force: bool = False) -> PipelineReport:
    """dry-run 보고서 JSON에서 CrawledMember 데이터를 읽어 노션에 저장한다."""
    import json

    data = json.loads(file_path.read_text(encoding="utf-8"))
    members_data = data.get("members", [])
    if not members_data:
        raise ValueError(f"파일에 members 데이터가 없습니다: {file_path}")

    report = PipelineReport()
    report.mode = "파일 임포트"
    report.llm_model = data.get("params", {}).get("llm_model", "")

    log.info("파일 임포트: %s (%d건)", file_path, len(members_data))
    saved_ids = []
    for member_data in members_data:
        member = CrawledMember.model_validate(member_data)
        try:
            page_id = await save_member(member, force=force)
        except Exception as exc:
            log.warning("저장 실패: %s", member.company, exc_info=True)
            report.add_failed(member.profile.url, member.company, "저장", str(exc))
            continue

        log.info("저장 완료: %s → %s", member.company, page_id)
        saved_ids.append(page_id)
        report.add_saved(
            blog_url=member.profile.url, blogger_name=member.company,
            company=member.company, role=member.role, trades=member.profile.trades,
            phone=member.phone, page_id=page_id,
            region=member.region_kr, address=member.profile.address, email=member.email,
            posts=len(member.posts), images=sum(len(p.images) for p in member.posts),
        )

    log.info("임포트 완료: %d/%d건 저장", len(saved_ids), len(members_data))
    return report


async def run_enrich(use_vision: bool = True, channel: str = "all") -> PipelineReport:
    """노션 DB에서 빈 필드가 있는 레코드를 찾아 재크롤링+LLM 분류로 보강한다."""
    all_pages = await find_pages_needing_enrichment()
    if channel == "blog":
        pages = [p for p in all_pages if "instagram.com" not in (p.get("detail_url") or "")]
    elif channel == "instagram":
        pages = [p for p in all_pages if "instagram.com" in (p.get("detail_url") or "")]
    else:
        pages = all_pages
    skipped = len(all_pages) - len(pages)
    log.info("보강 대상 레코드: %d건%s", len(pages), f" ({skipped}건 채널 필터로 제외)" if skipped else "")

    report = PipelineReport()
    report.mode = "필드 보강"
    report.llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model
    report.total_searched = len(pages)

    sem = asyncio.Semaphore(CONCURRENCY * 4)  # enrich는 I/O 위주, 429 미발생 확인
    enriched = 0

    # 빈 필드명 → CrawledMember 값 접근자 매핑
    _field_getters = {
        "연락처": lambda m: m.phone,
        "주소": lambda m: m.profile.address,
        "이메일": lambda m: m.email,
        "대표자": lambda m: m.name,
        "사업자등록번호": lambda m: m.brn,
    }

    async def _handle(page: dict, progress, task_id) -> None:
        nonlocal enriched
        page_id = page["page_id"]
        detail_url = page["detail_url"]
        name = page["name"]
        empty_fields: list[str] = page.get("empty_fields", [])

        progress.update(task_id, description=f"보강: {name[:20]}")

        if not detail_url:
            report.add_skipped(detail_url, name, "URL 없음")
            progress.console.print(f"  [dim]- {name} — 건너뜀 (URL 없음)[/dim]")
            return

        async with sem:
            # 1) 채널별 크롤링 디스패치
            is_instagram = "instagram.com" in detail_url
            try:
                if is_instagram:
                    ig_username = extract_instagram_username(detail_url)
                    if not ig_username:
                        report.add_skipped(detail_url, name, "인스타 사용자명 추출 실패")
                        progress.console.print(f"  [dim]- {name} — 건너뜀 (사용자명 없음)[/dim]")
                        return
                    profile = await explore_instagram_profile(ig_username)
                else:
                    profile = await explore_blogger(detail_url)
            except Exception as exc:
                log.warning("탐색 실패: %s", detail_url, exc_info=True)
                report.add_failed(detail_url, name, "탐색", str(exc))
                progress.console.print(f"  [red]x {name} — 탐색 실패[/red]")
                return

            profile_intro = profile.get("profile_intro", "") or profile.get("headline", "")
            if not profile["about"] and not profile_intro:
                report.add_skipped(detail_url, name, "본문 없음")
                progress.console.print(f"  [dim]- {name} — 건너뜀 (본문 없음)[/dim]")
                return

            # 2) LLM 분류
            combined_about = ""
            if profile_intro:
                combined_about += f"[프로필 소개]\n{profile_intro}\n\n"
            if profile["about"]:
                combined_about += f"[게시글 본문]\n{profile['about'][:3000]}"

            try:
                classification, usage = await classify(
                    name=name,
                    about=combined_about,
                    headline=profile.get("blog_title", "") or profile.get("headline", ""),
                )
                report.add_llm_usage(usage["input_tokens"], usage["output_tokens"])
            except Exception as exc:
                log.warning("분류 실패: %s", detail_url, exc_info=True)
                report.add_failed(detail_url, name, "분류", str(exc))
                progress.console.print(f"  [red]x {name} — 분류 실패[/red]")
                return

            # 3) 연락처/주소 보충
            phone_source = profile.get("phone_source", "")
            regex_phone = profile.get("phone", "")
            llm_phone = classification.get("phone", "")
            if phone_source == "profile":
                phone = regex_phone
            else:
                phone = llm_phone or regex_phone

            email = classification.get("email", "") or profile.get("email", "")
            address = classification.get("address", "")

            tech_name = classification.get("name", "") or name
            if tech_name and (not phone or not address):
                place = await search_local(tech_name)
                if place:
                    if not phone and place["telephone"]:
                        raw = place["telephone"].replace("-", "").replace(" ", "")
                        if raw.startswith("0"):
                            phone = format_phone(raw)
                            log.info("지역검색 연락처 보충: %s → %s", tech_name, phone)
                    if not address and (place["road_address"] or place["address"]):
                        address = place["road_address"] or place["address"]
                        log.info("지역검색 주소 보충: %s → %s", tech_name, address)

            # 4) Vision 보충: 배너/Footer 이미지에서 누락 정보 추출
            if use_vision and not is_instagram and (not phone or not classification.get("business_number")):
                from crawler.classifier import extract_text_from_image
                skin_urls = [
                    ("배너", profile.get("banner_image_url", "")),
                    ("Footer", profile.get("footer_image_url", "")),
                ]
                for label, img_url in skin_urls:
                    if not img_url:
                        continue
                    try:
                        vision_data, vision_usage = await extract_text_from_image(img_url)
                        report.add_llm_usage(vision_usage["input_tokens"], vision_usage["output_tokens"])
                        if not phone and vision_data.get("phone"):
                            phone = vision_data["phone"]
                            log.info("Vision(%s) 연락처 보충: %s → %s", label, tech_name, phone)
                        if not email and vision_data.get("email"):
                            email = vision_data["email"]
                        if not classification.get("business_number") and vision_data.get("business_number"):
                            classification["business_number"] = vision_data["business_number"]
                        if not classification.get("representative") and vision_data.get("representative"):
                            classification["representative"] = vision_data["representative"]
                        if not address and vision_data.get("address"):
                            address = vision_data["address"]
                    except Exception:
                        log.warning("Vision(%s) 추출 실패: %s", label, img_url, exc_info=True)
                    if phone and classification.get("business_number"):
                        break

            # 네이버 인증 사업자정보 — 1순위 덮어쓰기
            biz = profile.get("business_info") or {}
            if biz:
                if biz.get("phone"):
                    phone = biz["phone"]
                if biz.get("email"):
                    email = biz["email"]
                if biz.get("address"):
                    address = biz["address"]
                if biz.get("business_name"):
                    tech_name = biz["business_name"]
                if biz.get("representative"):
                    classification["representative"] = biz["representative"]
                if biz.get("business_number"):
                    classification["business_number"] = biz["business_number"]

            # 5) CrawledMember 구성 + enrichment 저장
            cover = profile.get("profile_pic_url", "") if is_instagram else profile.get("banner_image", "")
            trades = classification["trades"]
            # 한국어 라벨 → BE Trade enum 코드 (미대응 "기타" 등은 드랍)
            enum_trades = [c for t in trades if (c := trade_enum(t))]
            member = CrawledMember(
                company=tech_name,
                name=classification.get("representative", ""),
                phone=phone_digits(phone),
                picture=cover,
                role=classification["rank"],
                brn=classification.get("business_number", ""),
                email=email,
                profile=CrawledProfile(
                    primary_trade=enum_trades[0] if enum_trades else "",
                    trades=enum_trades,
                    experience=classification.get("experience"),
                    headline=profile_intro[:500],
                    about=profile["about"][:2000],
                    address=address,
                    state=REGION_ENUM_BY_KR.get(classification.get("region", ""), ""),
                    url=detail_url,
                    platform=PLATFORM_INSTAGRAM if is_instagram else PLATFORM_NAVER,
                ),
                posts=[CrawledPost(**post) for post in profile.get("posts", [])],
                source_urls=profile["source_urls"],
            )

            try:
                await update_member(page_id, member, force=False)
            except Exception as exc:
                log.warning("저장 실패: %s", detail_url, exc_info=True)
                report.add_failed(detail_url, name, "저장", str(exc))
                progress.console.print(f"  [red]x {name} — 저장 실패[/red]")
                return

            enriched += 1
            log.info("보강 완료: %s → %s", tech_name, page_id)
            report.add_saved(
                blog_url=detail_url, blogger_name=name,
                company=tech_name, role=member.role, trades=member.profile.trades,
                phone=phone_digits(phone), page_id=page_id,
                region=member.region_kr, address=address, email=email,
                posts=len(member.posts), images=sum(len(post.images) for post in member.posts),
            )

            # 보강 결과 표시: 빈 필드 중 채워진 것 / 못 채운 것
            filled = [f for f in empty_fields if _field_getters.get(f, lambda m: "")(member)]
            still_empty = [f for f in empty_fields if f not in filled]
            parts = []
            if filled:
                parts.append(f"[green]{', '.join(filled)}[/green]")
            if still_empty:
                parts.append(f"[dim]{', '.join(still_empty)} 못 찾음[/dim]")
            result_str = " / ".join(parts) if parts else "변경 없음"
            progress.console.print(f"  [green]v[/green] {tech_name} — {result_str}")

    progress = create_progress()
    with progress:
        task = progress.add_task(f"필드 보강 ({len(pages)}건)", total=len(pages))

        async def _wrap(page: dict) -> None:
            await _handle(page, progress, task)
            progress.advance(task)

        await asyncio.gather(*[_wrap(p) for p in pages])

    log.info("보강 완료: %d/%d건", enriched, len(pages))
    return report


async def run_patch_review(dry_run: bool = False) -> PipelineReport:
    """검수 DB 기존 데이터에 피드백 수정사항을 소급 적용한다.

    1. 연락처 하이픈 포매팅
    2. 구분(rank) "기공" → 비움
    3. 지역 보정 (주소 기반)
    4. 출처 URL → 블로그 홈 URL (본문 블록)
    """
    import re as _re

    pages = await find_all_review_pages()
    log.info("검수 DB 패치 대상: %d건", len(pages))

    report = PipelineReport()
    report.mode = "검수 DB 패치"
    report.total_searched = len(pages)

    patched = 0
    sem = asyncio.Semaphore(CONCURRENCY)

    progress = create_progress()
    with progress:
        task = progress.add_task(f"검수 DB 패치 ({len(pages)}건)", total=len(pages))

        async def _handle(page: dict) -> None:
            nonlocal patched
            page_id = page["page_id"]
            props = page["properties"]
            name = _read_prop(props, "업체명") or "(이름없음)"

            progress.update(task, description=f"패치: {name[:20]}")

            updates: dict = {}
            changes: list[str] = []

            async with sem:
                # 1. 연락처 하이픈 포매팅
                phone = _read_prop(props, "연락처")
                if phone:
                    formatted = format_phone(phone)
                    if formatted != phone:
                        updates["연락처"] = {"phone_number": formatted}
                        changes.append(f"연락처: {phone} → {formatted}")

                # 2. 구분(rank) "기공" → 비움
                rank = _read_prop(props, "구분")
                if rank == "기공":
                    updates["구분"] = {"select": None}
                    changes.append("구분: 기공 → (비움)")

                # 3. 지역 보정 (주소 기반)
                address = _read_prop(props, "주소")
                region = _read_prop(props, "지역")
                if address:
                    addr_region = infer_region_from_address(address)
                    if addr_region and addr_region != region:
                        updates["지역"] = {"select": {"name": addr_region}}
                        changes.append(f"지역: {region or '(없음)'} → {addr_region}")

                # 4. 출처 URL → 블로그 홈 (본문 블록)
                source_changed = False
                try:
                    blocks = await read_page_blocks(page_id)
                    for block in blocks:
                        if block["type"] != "paragraph":
                            continue
                        rt = block.get("paragraph", {}).get("rich_text", [])
                        if not rt:
                            continue
                        text = rt[0].get("plain_text", "")
                        if not text.startswith("출처:"):
                            continue
                        # 게시글 URL → 블로그 홈 URL 변환
                        new_text = text
                        urls = _re.findall(r"https?://(?:m\.)?blog\.naver\.com/(\w+)/\d+", text)
                        for blog_id in set(urls):
                            # 게시글 URL 패턴을 블로그 홈으로 치환
                            new_text = _re.sub(
                                rf"https?://(?:m\.)?blog\.naver\.com/{blog_id}/\d+",
                                f"https://blog.naver.com/{blog_id}",
                                new_text,
                            )
                        if new_text != text:
                            if not dry_run:
                                await update_block_text(block["id"], new_text)
                            source_changed = True
                            changes.append(f"출처: 게시글→블로그홈")
                except Exception as exc:
                    log.warning("블록 읽기 실패: %s (%s)", name, exc)

                if not changes:
                    progress.advance(task)
                    return

                if dry_run:
                    progress.console.print(f"  [yellow]dry-run[/yellow] {name} — {', '.join(changes)}")
                else:
                    if updates:
                        await patch_review_page(page_id, updates)
                    progress.console.print(f"  [green]v[/green] {name} — {', '.join(changes)}")

                patched += 1
                report.add_saved(
                    blog_url="", blogger_name=name,
                    company=name, role="", trades=[],
                    phone="", page_id=page_id,
                )

            progress.advance(task)

        await asyncio.gather(*[_handle(p) for p in pages])

    log.info("패치 완료: %d/%d건 수정", patched, len(pages))
    return report


async def run_approve() -> PipelineReport:
    """검수 DB에서 승인된 레코드를 프로덕션 DB로 이동한다."""
    pages = await find_approved()
    log.info("승인 건: %d건", len(pages))

    report = PipelineReport()
    report.mode = "검수 승인"
    report.total_searched = len(pages)

    if not pages:
        log.info("승인된 레코드가 없습니다")
        return report

    sem = asyncio.Semaphore(CONCURRENCY)
    moved = 0

    progress = create_progress()
    with progress:
        task = progress.add_task(f"프로덕션 이동 ({len(pages)}건)", total=len(pages))

        async def _handle(page: dict) -> None:
            nonlocal moved
            props = page["properties"]
            name_prop = props.get("업체명", {}).get("title", [])
            name = name_prop[0]["plain_text"] if name_prop and name_prop[0].get("plain_text") else "이름없음"

            async with sem:
                try:
                    page_id, status = await move_to_production(page)
                except Exception as exc:
                    log.warning("이동 실패: %s", name, exc_info=True)
                    report.add_failed("", name, "이동", str(exc))
                    progress.console.print(f"  [red]x {name} — 이동 실패[/red]")
                    progress.advance(task)
                    return

            moved += 1
            action = "업데이트" if status == "updated" else "신규생성"
            log.info("이동 완료: %s → %s (%s)", name, page_id, action)
            report.add_saved(
                blog_url="", blogger_name=name,
                company=name, role="", trades=[],
                phone="", page_id=page_id,
            )
            progress.console.print(f"  [green]v[/green] {name} → {action}")
            progress.advance(task)

        await asyncio.gather(*[_handle(p) for p in pages])

    log.info("승인 이동 완료: %d/%d건", moved, len(pages))
    return report


def main():
    """CLI 진입점."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="crawler",
        description="기술자 크롤링 파이프라인 — 네이버 블로그 / 인스타그램",
    )
    parser.add_argument("query", nargs="*", help="검색 쿼리 (기본: '타일 시공업체 수도권')")
    parser.add_argument("--full", action="store_true", help="전체 키워드 실행")
    parser.add_argument("--per-query", type=int, default=5, help="쿼리당 수집 수 (기본: 5)")
    parser.add_argument("--dry-run", action="store_true", help="노션 저장 없이 분류까지만 수행")
    parser.add_argument("--force", action="store_true", help="기존 업체도 재크롤링하여 덮어쓰기")
    parser.add_argument("--from-file", type=Path, metavar="JSON", help="검수한 JSON에서 노션 저장")
    parser.add_argument("--export-db", type=Path, metavar="JSON", help="dry-run JSON을 crawled_* DB에 적재 (#876)")
    parser.add_argument("--truncate", action="store_true", help="--export-db 시 기존 crawled_* 비우고 재적재")
    parser.add_argument("--enrich", action="store_true", help="빈 필드가 있는 기존 레코드를 재크롤링+LLM으로 보강")
    parser.add_argument("--instagram", action="store_true", help="인스타그램 채널 크롤링")
    parser.add_argument("--channel", choices=["blog", "instagram", "all"], default="all", help="enrich 대상 채널 (기본: all)")
    parser.add_argument("--approve", action="store_true", help="검수 DB 승인 건을 프로덕션 DB로 이동")
    parser.add_argument("--direct", action="store_true", help="검수 DB 거치지 않고 프로덕션 DB 직접 저장")
    parser.add_argument("--patch-review", action="store_true", help="검수 DB 기존 데이터에 피드백 수정사항 소급 적용")
    parser.add_argument("--collect-raw", action="store_true", help="#920 1단계: 검색·수집만 하여 원본을 파일로 저장(분류·저장 안 함)")
    parser.add_argument("--classify-from-raw", type=Path, metavar="RAW", help="#920 2단계: 저장된 원본(jsonl)을 읽어 분류만 실행(다시 수집하지 않음)")
    parser.add_argument("--raw-out", type=Path, metavar="JSONL", help="--collect-raw 저장 경로 (기본: reports/raw/naver-<시각>.jsonl)")
    parser.add_argument("--no-dedup", action="store_true", help="--collect-raw 중복 제외 끄기 (기본은 이미 수집/적재된 블로그 건너뜀)")
    vision_group = parser.add_mutually_exclusive_group()
    vision_group.add_argument("--vision", action="store_true", default=None, help="배너/Footer 이미지 Vision OCR 강제 활성화")
    vision_group.add_argument("--no-vision", action="store_true", help="Vision OCR 비활성화")
    args = parser.parse_args()

    # Vision 기본값: --full이면 OFF, 나머지 ON
    if args.vision:
        use_vision = True
    elif args.no_vision:
        use_vision = False
    else:
        use_vision = not args.full  # full은 기본 OFF, 나머지 ON

    setup_file_logging()

    llm_model = settings.openai_model if settings.openai_api_key else settings.anthropic_model
    report = PipelineReport()
    report.llm_model = llm_model

    if args.dry_run:
        console.print("[yellow]dry-run 모드: 노션 저장 건너뜀[/yellow]")
    if args.force:
        console.print("[yellow]force 모드: 기존 업체 데이터 덮어쓰기[/yellow]")
    console.print(f"[cyan]Vision OCR: {'ON' if use_vision else 'OFF'}[/cyan]")
    if args.from_file:
        console.print(f"[yellow]파일 임포트: {args.from_file}[/yellow]")
    if args.enrich:
        console.print("[yellow]필드 보강 모드: 빈 필드 있는 레코드 재크롤링+LLM[/yellow]")

    if args.instagram:
        console.print("[cyan]채널: 인스타그램[/cyan]")

    if args.patch_review:
        console.print("[cyan]검수 DB 패치 모드: 기존 데이터에 피드백 수정사항 적용[/cyan]")
    if args.approve:
        console.print("[cyan]검수 승인 모드: 승인 건 → 프로덕션 DB 이동[/cyan]")
    if args.direct:
        console.print("[yellow]direct 모드: 프로덕션 DB 직접 저장[/yellow]")

    # 프로그레스 바 모드: 콘솔 로그 억제 (파일 로그는 유지됨)
    suppress_console = args.full or args.enrich or args.approve or args.patch_review
    if suppress_console:
        logging.getLogger().setLevel(logging.WARNING)

    async def _run() -> PipelineReport:
        nonlocal report

        # 노션 DB 스키마 검증 (dry-run·export-db·raw 단계 제외 — 노션 무관)
        if not args.dry_run and not args.export_db and not args.collect_raw and not args.classify_from_raw:
            # 검수 DB 스키마 검증 (approve, patch-review 모드 또는 기본 모드)
            if args.approve or args.patch_review or not args.direct:
                review_errors = await validate_review_schema()
                if review_errors:
                    console.print("[red]검수 DB 스키마 불일치:[/red]")
                    for err in review_errors:
                        console.print(f"  [red]• {err}[/red]")
                    raise SystemExit(1)

            # 프로덕션 DB 스키마 검증 (approve, direct, enrich 모드)
            if args.approve or args.direct or args.enrich:
                schema_errors = await validate_schema()
                if schema_errors:
                    console.print("[red]노션 DB 스키마 불일치:[/red]")
                    for err in schema_errors:
                        console.print(f"  [red]• {err}[/red]")
                    raise SystemExit(1)

        if args.collect_raw:
            report = await run_collect_raw(keywords=args.query or None, per_query=args.per_query, force=args.force, out=args.raw_out, dedup=not args.no_dedup)
        elif args.classify_from_raw:
            report = await run_classify_from_raw(args.classify_from_raw, skip_vision=not use_vision)
        elif args.export_db:
            report = await run_export_db(args.export_db, truncate=args.truncate)
        elif args.patch_review:
            report = await run_patch_review(dry_run=args.dry_run)
        elif args.approve:
            report = await run_approve()
        elif args.enrich:
            report = await run_enrich(use_vision=use_vision, channel=args.channel)
        elif args.from_file:
            report = await run_from_file(args.from_file, force=args.force)
        elif args.instagram and args.full:
            report = await run_instagram_full(per_query=args.per_query, dry_run=args.dry_run, force=args.force, direct=args.direct)
        elif args.instagram:
            query = " ".join(args.query) if args.query else "타일 시공 인스타그램 site:instagram.com"
            count = 10 if args.query else 3
            report.mode = "인스타그램 단일 쿼리"
            report.per_query = count
            await run_instagram_pipeline(query, count=count, report=report, dry_run=args.dry_run, force=args.force, direct=args.direct)
        elif args.full:
            report = await run_full(per_query=args.per_query, dry_run=args.dry_run, force=args.force, direct=args.direct, use_vision=use_vision)
        else:
            query = " ".join(args.query) if args.query else "타일 시공업체 수도권"
            count = 10 if args.query else 3
            report.mode = "단일 쿼리"
            report.per_query = count
            await run_pipeline(query, count=count, report=report, dry_run=args.dry_run, force=args.force, direct=args.direct, skip_vision=not use_vision)

        return report

    try:
        report = asyncio.run(_run())
    except KeyboardInterrupt:
        console.print("\n[yellow]중단됨 — 부분 보고서 저장 중...[/yellow]")
    except Exception as exc:
        console.print(f"\n[red]오류: {exc}[/red]")
        report.add_failed("", "", "파이프라인", str(exc))
    finally:
        if suppress_console:
            logging.getLogger().setLevel(logging.INFO)

    md_path = report.save(REPORTS_DIR)
    print_summary(report)
    console.print(f"보고서: [link=file://{md_path.resolve()}]{md_path}[/link]")


if __name__ == "__main__":
    main()
