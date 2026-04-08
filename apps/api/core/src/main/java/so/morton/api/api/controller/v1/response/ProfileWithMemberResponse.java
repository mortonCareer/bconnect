package so.morton.api.api.controller.v1.response;

public record ProfileWithMemberResponse(
        MaskedMemberResponse member,
        ProfileResponse profile
) {}
