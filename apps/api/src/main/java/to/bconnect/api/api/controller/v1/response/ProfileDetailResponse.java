package to.bconnect.api.api.controller.v1.response;

public record ProfileDetailResponse(
        MaskedMemberResponse member,
        ProfileResponse profile,
        int postCount,
        int recommendationCount,
        int coworkerCount
) {}
