package to.bconnect.api.storage.company;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {

    Window<CompanyEntity> findAllBy(ScrollPosition position, Limit limit, Sort sort);

    List<CompanyEntity> findAllByIdIn(Collection<Long> ids);

    Optional<CompanyEntity> findByMemberId(Long memberId);

    boolean existsByMemberId(Long memberId);

    boolean existsByBrn(String brn);
}
