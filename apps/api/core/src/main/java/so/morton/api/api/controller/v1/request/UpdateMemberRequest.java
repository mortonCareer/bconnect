package so.morton.api.api.controller.v1.request;

import so.morton.api.storage.value.Role;

public record UpdateMemberRequest(
        String name,
        String picture,
        Role role
) {}
