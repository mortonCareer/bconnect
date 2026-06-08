package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CoworkerRequestQueryService {

    private final CoworkerRequestRepository requestRepository;
    private final MemberResolver memberResolver;

    @Transactional(readOnly = true)
    public List<Coworker> listReceived(AuthUser user) {
        List<CoworkerRequestEntity> requests = requestRepository.findByToId(user.id());
        List<Long> memberIds = requests.stream()
                .map(CoworkerRequestEntity::getFromId)
                .toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        return requests.stream()
                .map(it -> {
                    Member member = memberMap.get(it.getFromId());
                    return new Coworker(it.getId(), member);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Coworker> listSent(AuthUser user) {
        List<CoworkerRequestEntity> requests = requestRepository.findByFromId(user.id());
        List<Long> memberIds = requests.stream()
                .map(CoworkerRequestEntity::getToId)
                .toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        return requests.stream()
                .map(it -> {
                    Member member = memberMap.get(it.getToId());
                    return new Coworker(it.getId(), member);
                })
                .toList();
    }
}
