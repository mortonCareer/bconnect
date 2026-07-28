package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

// 한국소방시설협회 소방시설업체
@Entity
@Immutable
@Table(name = "feia_fire_licenses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FeiaFireLicenseEntity {

    @Id
    private Long id;

    private String companyName;   // 업체명 (company_name)

    private String ceoName;       // 대표자 (ceo_name)

    private String address;       // 주소 (address)

    private String licenseName;   // 등록번호 (license_name)

    private String licenseDiv;    // 구분 (license_div)
}
