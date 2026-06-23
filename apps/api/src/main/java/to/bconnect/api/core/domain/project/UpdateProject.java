package to.bconnect.api.core.domain.project;

import to.bconnect.api.storage.Address;

public record UpdateProject(
        String title,
        Address address
) {}
