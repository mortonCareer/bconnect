package to.bconnect.api.crawler.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "crawled_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CrawledMemberEntity extends BaseEntity {

    private static final String FOREMAN = "반장";

    private String company;

    private String name;

    private String phone;

    private String picture;

    private String role = FOREMAN;

    private String brn;

    private String email;

    public CrawledMemberEntity(String company, String name, String phone, String picture,
                               String brn, String email) {
        this.company = company;
        this.name = name;
        this.phone = phone;
        this.picture = picture;
        this.role = FOREMAN;
        this.brn = brn;
        this.email = email;
    }
}
