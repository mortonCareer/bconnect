"""파이프라인 실행 보고서 — Markdown 요약 + JSON 상세."""

import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class ItemResult:
    """파이프라인 항목 1건의 처리 결과."""

    blog_url: str
    blogger_name: str
    status: str  # "saved" | "synced" | "skipped" | "failed"
    # saved일 때만 채워짐
    tech_name: str = ""
    rank: str = ""
    trades: list[str] = field(default_factory=list)
    phone: str = ""
    page_id: str = ""
    # failed일 때만 채워짐
    error: str = ""
    stage: str = ""  # "탐색" | "분류" | "저장"


@dataclass
class PipelineReport:
    """파이프라인 실행 보고서 누적기."""

    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    queries: list[str] = field(default_factory=list)
    items: list[ItemResult] = field(default_factory=list)
    total_searched: int = 0
    # 실행 파라미터
    mode: str = ""  # "단일 쿼리" | "전체 키워드"
    per_query: int = 0
    # LLM 비용 추적
    llm_model: str = ""
    llm_calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0

    def add_saved(
        self, blog_url: str, blogger_name: str, tech_name: str,
        rank: str, trades: list[str], phone: str, page_id: str,
    ) -> None:
        self.items.append(ItemResult(
            blog_url=blog_url, blogger_name=blogger_name, status="saved",
            tech_name=tech_name, rank=rank, trades=trades,
            phone=phone, page_id=page_id,
        ))

    def add_synced(self, blog_url: str, blogger_name: str) -> None:
        self.items.append(ItemResult(
            blog_url=blog_url, blogger_name=blogger_name, status="synced",
        ))

    def add_skipped(self, blog_url: str, blogger_name: str, reason: str = "") -> None:
        self.items.append(ItemResult(
            blog_url=blog_url, blogger_name=blogger_name,
            status="skipped", error=reason,
        ))

    def add_failed(self, blog_url: str, blogger_name: str, stage: str, error: str) -> None:
        self.items.append(ItemResult(
            blog_url=blog_url, blogger_name=blogger_name,
            status="failed", stage=stage, error=error,
        ))

    def add_llm_usage(self, input_tokens: int, output_tokens: int) -> None:
        self.llm_calls += 1
        self.input_tokens += input_tokens
        self.output_tokens += output_tokens

    # --- 집계 ---

    def _count(self, status: str) -> int:
        return sum(1 for i in self.items if i.status == status)

    @property
    def saved_count(self) -> int:
        return self._count("saved")

    @property
    def synced_count(self) -> int:
        return self._count("synced")

    @property
    def skipped_count(self) -> int:
        return self._count("skipped")

    @property
    def failed_count(self) -> int:
        return self._count("failed")

    # --- 비용 추정 ---

    def _estimate_cost(self) -> float:
        """USD 기준 비용 추정. 모델별 대략적 단가."""
        model = self.llm_model.lower()
        if "gpt-4o-mini" in model:
            return self.input_tokens * 0.15e-6 + self.output_tokens * 0.6e-6
        if "gpt-4o" in model:
            return self.input_tokens * 2.5e-6 + self.output_tokens * 10e-6
        if "sonnet" in model:
            return self.input_tokens * 3e-6 + self.output_tokens * 15e-6
        if "haiku" in model:
            return self.input_tokens * 0.25e-6 + self.output_tokens * 1.25e-6
        return 0.0

    # --- 출력 ---

    def to_markdown(self) -> str:
        ended_at = datetime.now(timezone.utc)
        duration = (ended_at - self.started_at).total_seconds()
        kst_started = self.started_at.strftime("%Y-%m-%d %H:%M:%S")
        kst_ended = ended_at.strftime("%Y-%m-%d %H:%M:%S")

        lines = [
            f"# 크롤러 실행 보고서 — {self.started_at.strftime('%Y-%m-%d %H:%M')}",
            "",
            "## 실행 요약",
            "| 항목 | 값 |",
            "|------|-----|",
            f"| 시작 (UTC) | {kst_started} |",
            f"| 종료 (UTC) | {kst_ended} |",
            f"| 소요 시간 | {duration:.0f}초 |",
            f"| 검색 쿼리 | {len(self.queries)}개 |",
            f"| 검색 결과 | {self.total_searched}건 |",
            f"| 신규 저장 | {self.saved_count}건 |",
            f"| 싱크 갱신 | {self.synced_count}건 |",
            f"| 건너뜀 | {self.skipped_count}건 |",
            f"| 실패 | {self.failed_count}건 |",
        ]

        # 실행 파라미터
        queries_str = ", ".join(self.queries) if self.queries else "-"
        lines += [
            "", "## 실행 파라미터",
            "| 항목 | 값 |",
            "|------|-----|",
            f"| 실행 모드 | {self.mode} |",
            f"| 검색 쿼리 | {queries_str} |",
            f"| 쿼리당 수집 | {self.per_query}건 |",
            f"| LLM 모델 | {self.llm_model} |",
        ]

        # 비용 추정
        if self.llm_calls > 0:
            cost = self._estimate_cost()
            lines += [
                "", "## 비용 추정",
                "| 항목 | 값 |",
                "|------|-----|",
                f"| LLM 모델 | {self.llm_model} |",
                f"| API 호출 | {self.llm_calls}회 |",
                f"| 입력 토큰 | {self.input_tokens:,} |",
                f"| 출력 토큰 | {self.output_tokens:,} |",
                f"| 예상 비용 | ${cost:.4f} |",
            ]

        # 에러 로그
        failed = [i for i in self.items if i.status == "failed"]
        if failed:
            lines += [
                "", "## 에러 로그",
                "| URL | 단계 | 에러 |",
                "|-----|------|------|",
            ]
            for item in failed:
                short_err = item.error[:100].replace("|", "/")
                lines.append(f"| {item.blog_url} | {item.stage} | {short_err} |")

        lines.append("")
        return "\n".join(lines)

    def to_json(self) -> dict:
        return {
            "started_at": self.started_at.isoformat(),
            "params": {
                "mode": self.mode,
                "per_query": self.per_query,
                "llm_model": self.llm_model,
            },
            "queries": self.queries,
            "total_searched": self.total_searched,
            "summary": {
                "saved": self.saved_count,
                "synced": self.synced_count,
                "skipped": self.skipped_count,
                "failed": self.failed_count,
            },
            "llm": {
                "model": self.llm_model,
                "calls": self.llm_calls,
                "input_tokens": self.input_tokens,
                "output_tokens": self.output_tokens,
                "estimated_cost_usd": round(self._estimate_cost(), 6),
            },
            "items": [asdict(i) for i in self.items],
        }

    def save(self, directory: Path) -> Path:
        directory.mkdir(parents=True, exist_ok=True)
        stem = self.started_at.strftime("%Y-%m-%d_%H%M%S")

        md_path = directory / f"{stem}.md"
        md_path.write_text(self.to_markdown(), encoding="utf-8")

        json_path = directory / f"{stem}.json"
        json_path.write_text(
            json.dumps(self.to_json(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        return md_path
