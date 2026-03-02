package so.morton.api.storage.domain.member;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;
import so.morton.api.storage.value.Role;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberEntity extends BaseEntity {

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
    private Role role;

    @Builder
    public MemberEntity(String username, String name, String phone, String picture, Role role) {
        this.username = username;
        this.name = name;
        this.phone = phone;
        this.picture = picture;
        this.role = role;
    }

    public void update(String name, String picture, Role role) {
        this.name = name;
        this.picture = picture;
        this.role = role;
    }
}
