package to.bconnect.api.security.session;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.security.AuthUtils;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.session.SessionEntity;
import to.bconnect.api.storage.session.SessionRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(noRollbackFor = CodeException.class)
    public void verify(String username, String refreshToken) {
        val found = sessionRepository.findByMemberId(Long.valueOf(username))
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.isRevoked()) {
            throw new CodeException(AuthExceptionCode.SESSION_EXPIRED);
        }

        if (!AuthUtils.sha256(refreshToken).equals(found.getRefreshToken())) {
            found.revoke();
            throw new CodeException(AuthExceptionCode.INVALID_TOKEN);
        }
    }

    @Transactional
    public void login(String username, String agent, String ip, String refreshToken) {
        val id = Long.valueOf(username);
        val member = memberRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val encrypted = AuthUtils.sha256(refreshToken);
        val optional = sessionRepository.findByMemberId(id);

        if (optional.isPresent()) {
            optional.get().update(agent, ip, encrypted);
        } else {
            sessionRepository.save(
                    new SessionEntity(id, agent, ip, encrypted)
            );
            eventPublisher.publishEvent(new NewDeviceLoginEvent(member.getPhone()));
        }
    }

    @Transactional
    public void rotate(String username, String refreshToken) {
        val found = sessionRepository.findByMemberId(Long.valueOf(username))
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.rotate(AuthUtils.sha256(refreshToken));
    }

    @Transactional
    public void logout(String username) {
        val found = sessionRepository.findByMemberId(Long.valueOf(username))
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.revoke();
    }
}
