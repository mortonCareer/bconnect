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
@Table(name = "kiscon_admin_penalty")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 키스콘 행정처분
public class KisconAdminPenaltyEntity {

    @Id
    private Long ncrGsSeq;

    private String bizRegNo;

    private String tradeName;

    private String flag;   // 공시내용구분: 신규·정정·변경·철회 (flag)
}
