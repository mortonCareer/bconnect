package so.morton.api.api.controller.v1.request;

import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

import java.util.Set;

public record UpdateProfileRequest(
        Trade primaryTrade,
        Set<Trade> trades,
        int experience,
        String headline,
        Address address
) {}
