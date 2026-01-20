package so.morton.api.api.controller.v1.request;

import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Role;
import so.morton.api.storage.value.Trade;

import java.util.Set;

public record RegisterMemberRequest(
        String username,
        String name,
        String phone,
        String picture,
        Trade primaryTrade,
        Set<Trade> trades,
        int experience,
        Role role,
        String headline,
        String about,
        Address address
) {}
