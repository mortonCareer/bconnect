package to.bconnect.api.core.domain.profile;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record Profile(
    Long id,
    Member member,
    Trade primaryTrade,
    Set<Trade> trades,
    int experience,
    String headline,
    String about,
    Address address,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt,
    Long postCount,
    Long recommendationCount,
    Long coworkerCount
) {}
