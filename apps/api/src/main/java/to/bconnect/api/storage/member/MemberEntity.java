package to.bconnect.api.storage.member;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberEntity extends BaseEntity {

    public static final Long SYSTEM_ID = 0L;

    private static final long DEFAULT_DRIVE_LIMIT_BYTES = 1024L * 1024 * 1024;

    private String username;

    private String name;

    private String phone;

    private LocalDate birth;

    private boolean marketingConsent;

    @ElementCollection(targetClass = Role.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "member_roles", joinColumns = @JoinColumn(name = "member_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Set<Role> roles = new HashSet<>();

    private Long driveUsedBytes = 0L;

    private Long driveLimitBytes = DEFAULT_DRIVE_LIMIT_BYTES;

    public MemberEntity(String username, String name, String phone, LocalDate birth, boolean marketingConsent, Set<Role> roles) {
        this.username = username;
        this.name = name;
        this.phone = phone;
        this.birth = birth;
        this.marketingConsent = marketingConsent;
        this.roles = roles != null ? new HashSet<>(roles) : new HashSet<>();
    }

    public void update(String name) {
        this.name = name;
    }

    public void grantRole(Role role) {
        this.roles.remove(Role.GUEST);
        this.roles.add(role);
    }

    public void revokeRole(Role role) {
        this.roles.remove(role);
        if (this.roles.isEmpty())
            this.roles.add(Role.GUEST);
    }

    public void increaseDriveUsed(long delta) {
        this.driveUsedBytes += delta;
    }

    public void decreaseDriveUsed(long delta) {
        this.driveUsedBytes -= delta;
    }
}
