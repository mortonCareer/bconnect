package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.project.UpdateProject;
import to.bconnect.api.storage.Address;

public record UpdateProjectRequest(
        @NotBlank String title,
        @NotNull Address address
) {
    public UpdateProject toCommand() {
        return new UpdateProject(title, address);
    }
}
