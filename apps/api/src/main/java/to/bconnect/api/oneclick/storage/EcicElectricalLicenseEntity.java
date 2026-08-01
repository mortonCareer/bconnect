package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

// 한국전기공사협회 전기공사업체
@Entity
@Immutable
@Table(name = "ecic_electrical_licenses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EcicElectricalLicenseEntity {

    @Id
    private Long id;

    private String registrationNo;   // 등록번호 (registration_no)

    private String companyName;      // 상호 (company_name)

    private String representative;   // 대표자 (representative)

    private String address;          // 소재지 (address)

    private Instant syncedAt;        // 적재 시각 (synced_at)
}
