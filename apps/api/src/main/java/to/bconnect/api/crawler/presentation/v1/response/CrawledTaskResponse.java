package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledTaskEntity;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CrawledTaskResponse(
        Long id,
        String company,
        String address,
        String trade,
        LocalDate start,
        LocalDate end,
        String duration,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
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
