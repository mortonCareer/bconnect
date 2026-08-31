package to.bconnect.api.core.domain.retention;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.accesslog.LoginAccessLogEntity;
import to.bconnect.api.storage.accesslog.LoginAccessLogRepository;
import to.bconnect.api.storage.transactionparty.TransactionPartyEntity;
import to.bconnect.api.storage.transactionparty.TransactionPartyRepository;
import to.bconnect.api.storage.transactionparty.TransactionPartyType;
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
    @Autowired private LoginAccessLogRepository loginAccessLogRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("run - 만료된 보관 데이터가 있을 때 실행하면 만료 데이터만 삭제된다")
    void run_success() {
        val now = Instant.now();
        val expired = new TransactionPartyEntity(
                1L, 1L, "member", "01000000000", 2L, 2L, "company", "01000000001", "0000000000",
                TransactionPartyType.COMPANY, now
        );
        expired.withdraw(now.minusSeconds(2), now.minusSeconds(1));
        transactionPartyRepository.save(expired);
        val retained = new TransactionPartyEntity(
                2L, 1L, "member", "01000000000", 2L, 2L, "company", "01000000001", "0000000000",
                TransactionPartyType.COMPANY, now
        );
        retained.withdraw(now, now.plusSeconds(60));
        transactionPartyRepository.save(retained);
        val expiredCounterparty = new TransactionPartyEntity(
                3L, 3L, "member2", "01000000002", 4L, 4L, "company2", "01000000003", "0000000000",
                TransactionPartyType.COMPANY, now
        );
        expiredCounterparty.withdrawCounterparty(now.minusSeconds(2), now.minusSeconds(1));
        transactionPartyRepository.save(expiredCounterparty);
        val expiredMember = memberRepository.save(MemberFactory.entity("retention1", "01099999805", Role.CAREER));
        val retainedMember = memberRepository.save(MemberFactory.entity("retention2", "01099999806", Role.CAREER));
        val expiredSession = sessionRepository.saveAndFlush(SessionFactory.entity(expiredMember.getId()));
        val retainedSession = sessionRepository.saveAndFlush(SessionFactory.entity(retainedMember.getId()));
        val expiredLoginAccessLog = loginAccessLogRepository.saveAndFlush(
                new LoginAccessLogEntity(expiredMember.getId(), "agent", "127.0.0.1"));
        val retainedLoginAccessLog = loginAccessLogRepository.saveAndFlush(
                new LoginAccessLogEntity(retainedMember.getId(), "agent", "127.0.0.2"));
        jdbcTemplate.update(
                "UPDATE sessions SET modified_at = ? WHERE id = ?",
                now.minusSeconds(100L * 24 * 60 * 60).atOffset(ZoneOffset.UTC),
                expiredSession.getId()
        );
        jdbcTemplate.update(
                "UPDATE login_access_logs SET created_at = ? WHERE id = ?",
                now.minusSeconds(100L * 24 * 60 * 60).atOffset(ZoneOffset.UTC),
                expiredLoginAccessLog.getId()
        );
        val expiredToken = signupTokenRepository.save(
                new SignupTokenEntity("01099999803", "token-expired", now.minusSeconds(1)));
        val retainedToken = signupTokenRepository.save(
                new SignupTokenEntity("01099999804", "token-retained", now.plusSeconds(180)));

        scheduler.run();

        assertThat(transactionPartyRepository.findById(expired.getId())).isEmpty();
        assertThat(transactionPartyRepository.findById(retained.getId())).isPresent();
        val anonymizedCounterparty = transactionPartyRepository.findById(expiredCounterparty.getId()).orElseThrow();
        assertThat(anonymizedCounterparty.getMemberName()).isEqualTo("member2");
        assertThat(anonymizedCounterparty.getCounterpartyId()).isNull();
        assertThat(anonymizedCounterparty.getCounterpartyMemberId()).isNull();
        assertThat(anonymizedCounterparty.getCounterpartyName()).isNull();
        assertThat(anonymizedCounterparty.getCounterpartyPhone()).isNull();
        assertThat(anonymizedCounterparty.getCounterpartyBrn()).isNull();
        assertThat(sessionRepository.findById(expiredSession.getId())).isEmpty();
        assertThat(sessionRepository.findById(retainedSession.getId())).isPresent();
        assertThat(loginAccessLogRepository.findById(expiredLoginAccessLog.getId())).isEmpty();
        assertThat(loginAccessLogRepository.findById(retainedLoginAccessLog.getId())).isPresent();
        assertThat(signupTokenRepository.findById(expiredToken.getId())).isEmpty();
        assertThat(signupTokenRepository.findById(retainedToken.getId())).isPresent();
    }
}
