import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(nullable = false)
    private String picture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Trade primaryTrade;

    @ElementCollection(targetClass = Trade.class)
    @CollectionTable(name = "user_trades", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "trade")
    private Set<Trade> trades = new HashSet<>();

    @Column(nullable = false)
    private int experience;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String crew; // TODO 삭제

    // TODO 추가
    // crew_id: Long [nullable]

    private String headline;

    @Column(columnDefinition = "TEXT")
    private String about;

    @Embedded
    private Address address;

    @Builder
    public UserEntity(String username, String name, String phone, String picture,
                      Trade primaryTrade, Set<Trade> trades, int experience,
                      Role role, String crew, String headline, String about, Address address) {
        this.username = username;
        this.name = name;
        this.phone = phone;
        this.picture = picture;
        this.primaryTrade = primaryTrade;
        this.trades = trades != null ? trades : new HashSet<>();
        this.experience = experience;
        this.role = role;
        this.crew = crew;
        this.headline = headline;
        this.about = about;
        this.address = address;
    }

    private boolean isValidTrade() {
        return trades.contains(primaryTrade);
    }
}
