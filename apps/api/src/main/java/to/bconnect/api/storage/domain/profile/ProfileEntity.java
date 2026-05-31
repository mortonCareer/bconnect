package to.bconnect.api.storage.domain.profile;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.common.Address;
import to.bconnect.api.storage.common.BaseEntity;
import to.bconnect.api.storage.common.value.Trade;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileEntity extends BaseEntity {

    @Column(name = "member_id", nullable = false, unique = true)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Trade primaryTrade;

    // TODO: MappingTableEntity 분리
    @ElementCollection(targetClass = Trade.class)
    @CollectionTable(name = "profile_trades", joinColumns = @JoinColumn(name = "profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "trade")
    private Set<Trade> trades = new HashSet<>();

    @Column(nullable = false)
    private int experience;

    private String headline;

    @Column(columnDefinition = "TEXT")
    private String about;

    @Embedded
    private Address address;

    @Builder
    public ProfileEntity(Long memberId, Trade primaryTrade, Set<Trade> trades, int experience,
                         String headline, String about, Address address) {
        this.memberId = memberId;
        this.primaryTrade = primaryTrade;
        this.trades = trades != null ? trades : new HashSet<>();
        this.experience = experience;
        this.headline = headline;
        this.about = about;
        this.address = address;
    }

    public void update(Trade primaryTrade, Set<Trade> trades, int experience,
                       String headline, Address address) {
        this.primaryTrade = primaryTrade;
        this.trades = trades != null ? trades : new HashSet<>();
        this.experience = experience;
        this.headline = headline;
        this.address = address;
    }

    public void updateAbout(String about) {
        this.about = about;
    }
}
