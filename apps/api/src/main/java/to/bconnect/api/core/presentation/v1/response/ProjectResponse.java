package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.project.Project;
import to.bconnect.api.storage.Address;

import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
        Long companyId,
        String title,
        Address address,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static ProjectResponse of(Project project) {
        return new ProjectResponse(
                project.id(),
                project.companyId(),
                project.title(),
                project.address(),
                project.createdAt(),
                project.modifiedAt()
        );
    }
}
