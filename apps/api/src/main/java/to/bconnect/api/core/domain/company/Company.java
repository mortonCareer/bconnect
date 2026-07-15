package to.bconnect.api.core.domain.company;

import to.bconnect.api.storage.company.CompanyEntity;

import java.time.OffsetDateTime;

public record Company(
        Long id,
        Long memberId,
        String name,
        String brn,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static Company of(CompanyEntity entity) {
        return new Company(
                entity.getId(),
                entity.getMemberId(),
                entity.getName(),
                entity.getBrn(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
