package so.morton.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateCoworkerRequest;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerFinder coworkerFinder;
    private final ProfileFinder profileFinder;

    @Transactional
    public Coworker create(Long memberId, CreateCoworkerRequest request) {
        Long profileId = profileFinder.resolveId(memberId);
        CoworkerEntity entity = CoworkerEntity.builder()
                .fromId(profileId)
                .toId(request.toId())
                .build();
        CoworkerEntity saved = coworkerRepository.save(entity);
        return Coworker.of(saved);
    }

    @Transactional(readOnly = true)
    public List<Coworker> getByProfileId(Long profileId) {
        return coworkerFinder.findAcceptedByProfileId(profileId);
    }

    @Transactional
    public Coworker accept(Long coworkerId, Long memberId) {
        Long profileId = profileFinder.resolveId(memberId);
        CoworkerEntity entity = coworkerRepository.findById(coworkerId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getToId().equals(profileId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.accept();
        return Coworker.of(entity);
    }

    @Transactional
    public Coworker deny(Long coworkerId, Long memberId) {
        Long profileId = profileFinder.resolveId(memberId);
        CoworkerEntity entity = coworkerRepository.findById(coworkerId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getToId().equals(profileId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.deny();
        return Coworker.of(entity);
    }
}
