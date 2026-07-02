package to.bconnect.api.storage.member;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "members")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberEntity extends BaseEntity {

    public static final Long SYSTEM_ID = 0L;

    private String username;

    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    private Role role;

    public void update(String name) {
        this.name = name;
    }
}
