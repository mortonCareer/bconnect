package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrawledProfileRepository extends JpaRepository<CrawledProfileEntity, Long> {

    List<CrawledProfileEntity> findByMemberIdIn(List<Long> memberIds);
}
