package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.profile.ProfileEntity;
import so.morton.api.storage.domain.profile.ProfileRepository;
import so.morton.api.storage.value.Trade;

import java.util.Set;

@Component
public class ProfileFactory {

    @Autowired private ProfileRepository profileRepository;

    public ProfileEntity create(Long memberId) {
        return profileRepository.save(ProfileEntity.builder()
                .memberId(memberId)
                .primaryTrade(Trade.ELECTRICAL)
                .trades(Set.of(Trade.ELECTRICAL))
                .experience(5)
                .headline("headline")
                .about("about")
                .address(Fixtures.ADDRESS)
                .build());
    }
}
