package to.bconnect.api.core.domain.profile;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.util.Set;

public record UpdateProfile(
        ProfileRole role,
        Trade primaryTrade,
        Set<Trade> trades,
        int experience,
        String headline,
        Address address
) {}
