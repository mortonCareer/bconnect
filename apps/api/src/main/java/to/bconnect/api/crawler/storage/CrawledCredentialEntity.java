package to.bconnect.api.crawler.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "crawled_credentials")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CrawledCredentialEntity extends BaseEntity {

    private Long profileId;

    @Enumerated(EnumType.STRING)
    private CrawledCredentialType type;

    private String name;
}
