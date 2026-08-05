package to.bconnect.api.core.presentation.v1.request;

import to.bconnect.api.core.domain.post.SearchFeed;
import to.bconnect.api.storage.Region;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record FeedFilter(
        // profile
        Set<ProfileRole> role,
        Set<Trade> trades,
        Integer minExperience,
        Integer maxExperience,
        Set<Region> states,

        // task
        LocalDate start,
        LocalDate end
) {
    public SearchFeed toCommand() {
        return new SearchFeed(role, trades, minExperience, maxExperience, states, start, end);
    }
}
