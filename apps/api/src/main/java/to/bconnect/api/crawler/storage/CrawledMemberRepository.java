package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CrawledMemberRepository extends JpaRepository<CrawledMemberEntity, Long> {
}
