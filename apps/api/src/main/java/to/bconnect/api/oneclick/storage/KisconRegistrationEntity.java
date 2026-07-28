package to.bconnect.api.oneclick.storage;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "kiscon_registration")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 키스콘 건설업 등록
public class KisconRegistrationEntity {

    @Id
    private Long ncrGsSeq;

    private String bizRegNo;

    private String companyName;

    private String representative;

    private String tradeName;

    private Integer regDate;

    private String address;

    private String flag;   // 공시내용구분: 신규·정정·변경·철회 (flag)
}
