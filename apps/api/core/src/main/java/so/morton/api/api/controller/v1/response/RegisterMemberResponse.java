package so.morton.api.api.controller.v1.response;

public record RegisterMemberResponse(
        Long memberId,
        String accessToken
) {}
