package to.bconnect.api.crawler.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.crawler.storage.CrawledCredentialEntity;
import to.bconnect.api.crawler.storage.CrawledCredentialRepository;
import to.bconnect.api.crawler.storage.CrawledMemberEntity;
import to.bconnect.api.crawler.storage.CrawledMemberRepository;
import to.bconnect.api.crawler.storage.CrawledPostEntity;
import to.bconnect.api.crawler.storage.CrawledPostRepository;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;
import to.bconnect.api.crawler.storage.CrawledProfileRepository;
import to.bconnect.api.crawler.storage.CrawledTaskEntity;
import to.bconnect.api.crawler.storage.CrawledTaskRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrawledMemberService {

    private static final int THUMBNAIL_LIMIT = 3;

    private final CrawledMemberRepository crawledMemberRepository;
    private final CrawledProfileRepository crawledProfileRepository;
    private final CrawledPostRepository crawledPostRepository;
    private final CrawledTaskRepository crawledTaskRepository;
    private final CrawledCredentialRepository crawledCredentialRepository;

    @Transactional(readOnly = true)
    public CursorPage<CrawledMemberEntity> list(CursorLimit cursor) {
        val members = crawledMemberRepository.findAllBy(
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                members,
                CrawledMemberEntity::getId
        );
    }

    @Transactional(readOnly = true)
    public CrawledMemberEntity get(Long memberId) {
        return crawledMemberRepository.findById(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Optional<CrawledProfileEntity> getProfile(Long memberId) {
        return crawledProfileRepository.findByMemberId(memberId);
    }

    @Transactional(readOnly = true)
    public Map<Long, CrawledProfileEntity> resolveProfileMap(List<Long> memberIds) {
        return crawledProfileRepository.findByMemberIdIn(memberIds)
                .stream()
                .collect(Collectors.toMap(CrawledProfileEntity::getMemberId, Function.identity()));
    }

    @Transactional(readOnly = true)
    public Map<Long, List<String>> resolveThumbnailMap(List<Long> memberIds) {
        return crawledPostRepository.findFirstImagesByMemberIdIn(memberIds).entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        it -> it.getValue().stream().limit(THUMBNAIL_LIMIT).toList()
                ));
    }

    @Transactional(readOnly = true)
    public List<CrawledCredentialEntity> listCredential(Long memberId) {
        return crawledCredentialRepository.findByMemberId(memberId);
    }

    @Transactional(readOnly = true)
    public List<CrawledPostEntity> listPost(Long memberId) {
        return crawledPostRepository.findByMemberId(memberId);
    }

    @Transactional(readOnly = true)
    public Map<Long, CrawledTaskEntity> resolveTaskMap(List<Long> taskIds) {
        return crawledTaskRepository.findAllById(taskIds)
                .stream()
                .collect(Collectors.toMap(CrawledTaskEntity::getId, Function.identity()));
    }
}
