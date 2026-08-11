package to.bconnect.api.core.domain.company;

public record CreateCompany(
        String name,
        String brn,
        Long pictureId,
        Long attachmentId
) {}
