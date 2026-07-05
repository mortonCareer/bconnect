package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CrawledPostRepository extends JpaRepository<CrawledPostEntity, Long> {

    List<CrawledPostEntity> findByMemberId(Long memberId);
}
