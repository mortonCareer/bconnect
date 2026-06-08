package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerEntity;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.core.domain.MemberResolver;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CoworkerRequestService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository requestRepository;
    private final MemberRepository memberRepository;
    private final MemberResolver memberResolver;

    @Transactional
    public CoworkerRequest create(AuthUser user, Long targetId) {
        if (user.id().equals(targetId))
            throw new CodeException(CoworkerExceptionCode.SELF_REQUEST);
        if (!memberRepository.existsById(targetId))
            throw new CodeException(CoworkerExceptionCode.TARGET_NOT_FOUND);
        if (coworkerRepository.existsByMinIdAndMaxId(Math.min(user.id(), targetId), Math.max(user.id(), targetId)))
            throw new CodeException(CoworkerExceptionCode.ALREADY_COWORKER);
        if (requestRepository.findByFromIdAndToId(user.id(), targetId).isPresent())
            throw new CodeException(CoworkerExceptionCode.ALREADY_REQUESTED);

        // accept
        requestRepository.findByFromIdAndToId(targetId, user.id())
                .ifPresent(request -> accept(user, request.getId()));

        CoworkerRequestEntity entity = requestRepository.save(CoworkerRequestEntity.builder()
                .fromId(user.id())
                .toId(targetId)
                .build());
        return CoworkerRequest.of(entity);
    }

    @Transactional(readOnly = true)
    public List<CoworkerMember> listReceived(AuthUser user) {
        List<CoworkerRequest> requests = requestRepository.findByToId(user.id())
                .stream().map(CoworkerRequest::of).toList();

        List<Long> memberIds = requests.stream()
                .map(CoworkerRequest::fromId)
                .toList();

        Map<Long, Member> memberMap = memberResolver.resolveMap(memberIds);

        return requests.stream()
                .map(request -> {
                    Member member = memberMap.get(request.fromId());
                    return CoworkerMember.of(request.id(), member);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CoworkerMember> listSent(AuthUser user) {
        List<CoworkerRequest> requests = requestRepository.findByFromId(user.id())
                .stream().map(CoworkerRequest::of).toList();

        List<Long> memberIds = requests.stream()
                .map(CoworkerRequest::toId)
                .toList();

        Map<Long, Member> memberMap = memberResolver.resolveMap(memberIds);

        return requests.stream()
                .map(request -> {
                    Member member = memberMap.get(request.toId());
                    return CoworkerMember.of(request.id(), member);
                })
                .toList();
    }

    @Transactional
    public void accept(AuthUser user, Long id) {
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        Long fromId = found.getFromId();
        Long toId = found.getToId();

        requestRepository.delete(found);

        CoworkerEntity coworker = CoworkerEntity.builder()
                .minId(Math.min(fromId, toId))
                .maxId(Math.max(fromId, toId))
                .build();

        coworkerRepository.save(coworker);
    }

    @Transactional
    public void deny(AuthUser user, Long id) {
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        requestRepository.delete(found);
    }

    @Transactional
    public void cancel(AuthUser user, Long id) {
        requestRepository.findById(id).ifPresent(found -> {
            if (!found.getFromId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            requestRepository.delete(found);
        });
    }
}
