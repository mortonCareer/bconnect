package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

// 소방청 소방시설업체
@Entity
@Immutable
@Table(name = "feia_fire_licenses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FeiaFireLicenseEntity {

    @Id
    private Long id;

    private Integer seqNo;        // 순번 (seq_no)

    private String companyName;   // 상호 (company_name)

    private String ceoName;       // 대표자 (ceo_name)

    private String address;       // 본사주소 (address)

    private String businessType;  // 업종: 공사업·설계업·감리업·방염업 (business_type)

    private String licenseDiv;    // 분야 (license_div)

    private String postalCode;    // 우편번호 (postal_code)

    private String phone;         // 전화번호 (phone)

    private String region;        // 지역 (region)

    private String regionDetail;  // 조회지역 (region_detail)

    private Instant syncedAt;     // 적재 시각 (synced_at)
}
