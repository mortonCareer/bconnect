package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.recommendation.RecommendationEntity;
import to.bconnect.api.storage.recommendation.RecommendationRepository;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final CoworkerRepository coworkerRepository;

    @Transactional
    public Long create(AuthUser user, CreateRecommendation command) {
        Long fromId = user.id();
        Long toId = command.toId();

        if (fromId.equals(toId))
            throw new CodeException(RecommendationExceptionCode.SELF_RECOMMENDATION);
        if (!coworkerRepository.existsByMembers(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.NOT_COWORKER);
        if (recommendationRepository.existsByFromIdAndToId(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.ALREADY_EXISTS);

        RecommendationEntity created = new RecommendationEntity(fromId, toId, command.content());
        recommendationRepository.save(created);

        // TODO: 알림 전송 (toId 회원에게)

        return created.getId();
    }

    @Transactional
    public void update(AuthUser user, Long id, String content) {
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getFromId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        recommendationRepository.findById(id).ifPresent(it -> {
            if (!it.getFromId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            recommendationRepository.delete(it);
        });
    }

    @Transactional
    public void hide(AuthUser user, Long id) {
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.hide();
    }

    @Transactional
    public void show(AuthUser user, Long id) {
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.show();
    }
}
