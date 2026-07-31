package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.project.CreateProject;
import to.bconnect.api.storage.Address;

public record CreateProjectRequest(
        @NotBlank String title,
        @Valid @NotNull Address address
) {
    public CreateProject toCommand() {
        return new CreateProject(title, address);
    }
}
