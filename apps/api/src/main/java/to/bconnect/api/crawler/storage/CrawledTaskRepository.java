package to.bconnect.api.crawler.storage;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CrawledTaskRepository extends JpaRepository<CrawledTaskEntity, Long> {
}
