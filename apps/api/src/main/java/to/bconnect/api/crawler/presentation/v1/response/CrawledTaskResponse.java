package to.bconnect.api.crawler.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.crawler.storage.CrawledTaskEntity;

import java.time.LocalDate;
import java.time.Instant;

public record CrawledTaskResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String company,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String trade,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) LocalDate start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) LocalDate end,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String duration,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static CrawledTaskResponse of(CrawledTaskEntity task) {
        return new CrawledTaskResponse(
                task.getId(),
                task.getCompany(),
                task.getAddress(),
                task.getTrade(),
                task.getStart(),
                task.getEnd(),
                task.getDuration(),
                task.getCreatedAt(),
                task.getModifiedAt()
        );
    }
}
