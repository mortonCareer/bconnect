"""Rich 기반 파이프라인 진행 표시."""

from rich.console import Console
from rich.progress import (
    Progress,
    BarColumn,
    MofNCompleteColumn,
    TextColumn,
    TimeElapsedColumn,
    SpinnerColumn,
)
from rich.table import Table
from rich.live import Live
from rich.panel import Panel
from rich.layout import Layout

from crawler.report import PipelineReport


console = Console(stderr=True)


def create_progress() -> Progress:
    """파이프라인용 프로그레스 바를 생성한다."""
    return Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(bar_width=30),
        MofNCompleteColumn(),
        TextColumn("│"),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    )


def print_summary(report: PipelineReport) -> None:
    """파이프라인 완료 후 최종 요약을 출력한다."""
    duration = (report._ended_at or report.started_at) - report.started_at
    cost = report._estimate_cost()

    table = Table(title="파이프라인 실행 결과", show_header=False, border_style="blue")
    table.add_column("항목", style="bold")
    table.add_column("값", justify="right")

    table.add_row("소요 시간", f"{duration.total_seconds():.0f}초")
    table.add_row("검색 결과", f"{report.total_searched}건")
    table.add_row("[green]신규 저장", f"[green]{report.saved_count}건")
    table.add_row("싱크 갱신", f"{report.synced_count}건")
    table.add_row("건너뜀", f"{report.skipped_count}건")
    if report.failed_count:
        table.add_row("[red]실패", f"[red]{report.failed_count}건")
    if report.llm_calls:
        table.add_row("LLM 호출", f"{report.llm_calls}회")
        table.add_row("예상 비용", f"${cost:.4f}")

    console.print()
    console.print(table)
