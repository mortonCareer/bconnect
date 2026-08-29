package to.bconnect.api.core.domain.retention;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.retention.TransactionPartyEntity;
import to.bconnect.api.storage.retention.TransactionPartyRepository;
import to.bconnect.api.storage.retention.AccessLogEntity;
import to.bconnect.api.storage.retention.AccessLogRepository;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.storage.signup.SignupTokenEntity;
import to.bconnect.api.storage.signup.SignupTokenRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.SessionFactory;

import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class RetentionExpirationSchedulerTest {

    @Autowired private RetentionExpirationScheduler scheduler;
    @Autowired private TransactionPartyRepository transactionPartyRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private SignupTokenRepository signupTokenRepository;
    @Autowired private AccessLogRepository accessLogRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("run - 만료된 보관 데이터가 있을 때 실행하면 만료 데이터만 삭제된다")
    void run_success() {
        val now = Instant.now();
        val expired = transactionPartyRepository.save(new TransactionPartyEntity(
                1L, "member", "01000000000", 2L, "company", "0000000000", now, now.minusSeconds(2), now.minusSeconds(1)
        ));
        val retained = transactionPartyRepository.save(new TransactionPartyEntity(
                1L, "member", "01000000000", 2L, "company", "0000000000", now, now, now.plusSeconds(60)
        ));
        val expiredMember = memberRepository.save(MemberFactory.entity("retention1", "01099999805", Role.CAREER));
        val retainedMember = memberRepository.save(MemberFactory.entity("retention2", "01099999806", Role.CAREER));
        val expiredSession = sessionRepository.saveAndFlush(SessionFactory.entity(expiredMember.getId()));
        val retainedSession = sessionRepository.saveAndFlush(SessionFactory.entity(retainedMember.getId()));
        val expiredAccessLog = accessLogRepository.saveAndFlush(new AccessLogEntity(expiredMember.getId(), "agent", "127.0.0.1"));
        val retainedAccessLog = accessLogRepository.saveAndFlush(new AccessLogEntity(retainedMember.getId(), "agent", "127.0.0.2"));
        jdbcTemplate.update(
                "UPDATE sessions SET modified_at = ? WHERE id = ?",
                now.minusSeconds(100L * 24 * 60 * 60).atOffset(ZoneOffset.UTC),
                expiredSession.getId()
        );
        jdbcTemplate.update(
                "UPDATE access_logs SET created_at = ? WHERE id = ?",
                now.minusSeconds(100L * 24 * 60 * 60).atOffset(ZoneOffset.UTC),
                expiredAccessLog.getId()
        );
        val expiredToken = signupTokenRepository.save(
                new SignupTokenEntity("01099999803", "token-expired", now.minusSeconds(1)));
        val retainedToken = signupTokenRepository.save(
                new SignupTokenEntity("01099999804", "token-retained", now.plusSeconds(180)));

        scheduler.run();

        assertThat(transactionPartyRepository.findById(expired.getId())).isEmpty();
        assertThat(transactionPartyRepository.findById(retained.getId())).isPresent();
        assertThat(sessionRepository.findById(expiredSession.getId())).isEmpty();
        assertThat(sessionRepository.findById(retainedSession.getId())).isPresent();
        assertThat(accessLogRepository.findById(expiredAccessLog.getId())).isEmpty();
        assertThat(accessLogRepository.findById(retainedAccessLog.getId())).isPresent();
        assertThat(signupTokenRepository.findById(expiredToken.getId())).isEmpty();
        assertThat(signupTokenRepository.findById(retainedToken.getId())).isPresent();
    }
}
