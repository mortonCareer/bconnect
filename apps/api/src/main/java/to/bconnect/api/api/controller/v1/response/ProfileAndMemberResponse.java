package to.bconnect.api.api.controller.v1.response;

public record ProfileAndMemberResponse(
        MaskedMemberResponse member,
        ProfileResponse profile
) {}
