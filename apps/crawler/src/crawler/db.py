"""crawled_* DB 적재 — dry-run JSON(members[])을 서비스 DB 테이블에 넣는다.

⚠️ BE(apps/api)를 우회해 crawled_* 테이블에 직접 INSERT 한다. 크롤러가 BE DB 스키마를
알아야 하는 이중 관리 — BE 스키마 변경 시 여기도 맞춰야 한다 (#876).

멱등: profile.url 기준으로 기존 레코드를 찾아 관련 행을 지우고 재삽입한다.
member.sourceUrls 는 profile.url 과 겹치는 출처 메타라 적재하지 않는다.
"""

import logging

import asyncpg

from crawler.models import CrawledMember

log = logging.getLogger(__name__)

# NOT NULL 이라 role 미상 시 BE 엔티티 기본값과 동일하게
DEFAULT_ROLE = "반장"


async def load_existing_urls(db_url: str) -> set[str]:
    """이미 DB에 적재된(살아있는) 크롤 프로필 url 집합. 중복 수집 방지용."""
    conn = await asyncpg.connect(db_url)
    try:
        rows = await conn.fetch("SELECT url FROM crawled_profiles WHERE deleted_at IS NULL AND url <> ''")
    finally:
        await conn.close()
    return {r["url"] for r in rows}

_TABLES_IN_FK_ORDER = [
    "crawled_post_images",
    "crawled_posts",
    "crawled_profile_trades",
    "crawled_credentials",
    "crawled_profiles",
    "crawled_members",
]


async def export_members(
    members: list[CrawledMember], db_url: str, *, truncate: bool = False
) -> tuple[int, int]:
    """members 를 crawled_* 에 적재한다. (신규, 갱신) 건수를 반환."""
    conn = await asyncpg.connect(db_url)
    created = updated = 0
    try:
        if truncate:
            await conn.execute(
                f"TRUNCATE {', '.join(_TABLES_IN_FK_ORDER)} RESTART IDENTITY CASCADE"
            )
            log.info("기존 crawled_* 데이터 비움 (truncate)")

        for member in members:
            async with conn.transaction():
                is_new = await _upsert_member(conn, member)
                created += is_new
                updated += not is_new
    finally:
        await conn.close()
    return created, updated


async def _upsert_member(conn: asyncpg.Connection, member: CrawledMember) -> bool:
    """member 1건 upsert. 신규면 True, 갱신이면 False."""
    profile = member.profile
    url = profile.url
    role = member.role or DEFAULT_ROLE

    # profile.url 로 기존 member 찾기 (unique key)
    existing_member_id = None
    if url:
        existing_member_id = await conn.fetchval(
            "SELECT member_id FROM crawled_profiles WHERE url = $1 AND deleted_at IS NULL",
            url,
        )

    if existing_member_id is not None:
        member_id = existing_member_id
        await conn.execute(
            """UPDATE crawled_members
               SET company=$2, name=$3, phone=$4, picture=$5, role=$6, brn=$7, email=$8,
                   instagram=$9, youtube=$10, modified_at=now()
               WHERE id=$1""",
            member_id,
            member.company, member.name or None, member.phone or None,
            member.picture or None, role, member.brn or None, member.email or None,
            member.instagram or None, member.youtube or None,
        )
        # 하위 행은 지우고 재삽입 (멱등)
        await conn.execute("DELETE FROM crawled_post_images WHERE post_id IN "
                           "(SELECT id FROM crawled_posts WHERE member_id=$1)", member_id)
        await conn.execute("DELETE FROM crawled_posts WHERE member_id=$1", member_id)
        await conn.execute("DELETE FROM crawled_credentials WHERE member_id=$1", member_id)
        await conn.execute("DELETE FROM crawled_profile_trades WHERE profile_id IN "
                           "(SELECT id FROM crawled_profiles WHERE member_id=$1)", member_id)
        await conn.execute("DELETE FROM crawled_profiles WHERE member_id=$1", member_id)
        is_new = False
    else:
        member_id = await conn.fetchval(
            """INSERT INTO crawled_members
               (company, name, phone, picture, role, brn, email, instagram, youtube,
                created_at, modified_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now()) RETURNING id""",
            member.company, member.name or None, member.phone or None,
            member.picture or None, role, member.brn or None, member.email or None,
            member.instagram or None, member.youtube or None,
        )
        is_new = True

    profile_id = await conn.fetchval(
        """INSERT INTO crawled_profiles
           (member_id, primary_trade, experience, headline, address, state, url, platform,
            blog_title, profile_image_url, cover_image_url, external_url,
            created_at, modified_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now(), now()) RETURNING id""",
        member_id,
        profile.primary_trade or None, profile.experience,
        (profile.headline or None) and profile.headline[:255],
        (profile.address or None) and profile.address[:255],
        profile.state or None, url, profile.platform,
        (profile.blog_title or None) and profile.blog_title[:255],
        profile.profile_image_url or None,
        profile.cover_image_url or None,
        profile.external_url or None,
    )
    for trade in profile.trades:
        await conn.execute(
            "INSERT INTO crawled_profile_trades (profile_id, trade) VALUES ($1,$2)",
            profile_id, trade,
        )

    for credential in member.credentials:
        if not credential.name:
            continue
        await conn.execute(
            """INSERT INTO crawled_credentials (member_id, type, name, created_at, modified_at)
               VALUES ($1,$2,$3, now(), now())""",
            member_id, credential.type, credential.name[:255],
        )

    for post in member.posts:
        if not post.source_url:
            # 글을 수집했으면 그 글 주소도 반드시 있다. 없으면 수집 경로 버그다.
            log.warning("글 주소 없는 게시글 건너뜀: %s (%s)", post.title[:30], url)
            continue
        post_id = await conn.fetchval(
            """INSERT INTO crawled_posts (member_id, title, content, source_url,
                                          created_at, modified_at)
               VALUES ($1,$2,$3,$4, now(), now()) RETURNING id""",
            member_id, (post.title or None) and post.title[:255], post.content or None,
            post.source_url,
        )
        for seq, image_url in enumerate(post.images):
            await conn.execute(
                "INSERT INTO crawled_post_images (post_id, seq, url) VALUES ($1,$2,$3)",
                post_id, seq, image_url,
            )

    return is_new
