package to.bconnect.api.core.domain.project;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.project.ProjectEntity;

import java.time.Instant;

public record Project(
        Long id,
        Long companyId,
        String title,
        Address address,
        Instant createdAt,
        Instant modifiedAt
) {
    public static Project of(ProjectEntity entity) {
        return new Project(
                entity.getId(),
                entity.getCompanyId(),
                entity.getTitle(),
                entity.getAddress(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
