package to.bconnect.api.storage.profile;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.BaseEntity;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "profiles")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileEntity extends BaseEntity {

    private Long memberId;

    @Enumerated(EnumType.STRING)
    private ProfileRole role;

    @Enumerated(EnumType.STRING)
    private Trade primaryTrade;

    @ElementCollection(targetClass = Trade.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_trades", joinColumns = @JoinColumn(name = "profile_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "trade")
    private Set<Trade> trades = new HashSet<>();

    private int experience;

    private String headline;

    private String about;

    @Embedded
    private Address address;

    public void update(ProfileRole role, Trade primaryTrade, Set<Trade> trades, int experience,
                       String headline, Address address) {
        this.role = role;
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
