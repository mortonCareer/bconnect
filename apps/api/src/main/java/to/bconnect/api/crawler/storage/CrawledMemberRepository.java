package to.bconnect.api.crawler.storage;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrawledMemberRepository extends JpaRepository<CrawledMemberEntity, Long> {

    Window<CrawledMemberEntity> findAllBy(ScrollPosition position, Limit limit, Sort sort);
}
