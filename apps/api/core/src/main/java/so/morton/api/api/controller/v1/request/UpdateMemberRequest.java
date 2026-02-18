package so.morton.api.api.controller.v1.request;

public record UpdateMemberRequest(
        String name,
        String phone,
        String picture
) {}
