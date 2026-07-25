package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CrawledProfileRepository extends JpaRepository<CrawledProfileEntity, Long> {

    Optional<CrawledProfileEntity> findByMemberId(Long memberId);

    List<CrawledProfileEntity> findByMemberIdIn(List<Long> memberIds);
}
