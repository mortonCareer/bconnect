package to.bconnect.api.crawler.storage;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "crawled_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CrawledProfileEntity extends BaseEntity {

    private Long memberId;

    private String primaryTrade;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "crawled_profile_trades", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "trade")
    private Set<String> trades = new HashSet<>();

    private Integer experience;

    private String headline;

    private String about;

    private String address;

    @Enumerated(EnumType.STRING)
    private CrawledRegion state;

    private String url;

    @Enumerated(EnumType.STRING)
    private CrawledPlatform platform;

    public CrawledProfileEntity(Long memberId, String primaryTrade, Set<String> trades, Integer experience,
                                String headline, String about, String address, CrawledRegion state,
                                String url, CrawledPlatform platform) {
        this.memberId = memberId;
        this.primaryTrade = primaryTrade;
        this.trades = trades != null ? trades : new HashSet<>();
        this.experience = experience;
        this.headline = headline;
        this.about = about;
        this.address = address;
        this.state = state;
        this.url = url;
        this.platform = platform;
    }
}
