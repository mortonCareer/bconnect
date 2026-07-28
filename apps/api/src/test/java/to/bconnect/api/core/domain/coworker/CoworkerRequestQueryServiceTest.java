package to.bconnect.api.core.domain.coworker;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CoworkerRequestFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class CoworkerRequestQueryServiceTest {

    @Autowired private CoworkerRequestQueryService coworkerRequestQueryService;
    @Autowired private CoworkerRequestRepository coworkerRequestRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("listReceived - 받은 요청이 있을 때 조회하면 보낸 회원 id 목록을 반환한다")
    void listReceived_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(other.getId(), member.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(another.getId(), member.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(member.getId(), other.getId()));

        // when
        val response = coworkerRequestQueryService.listReceived(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(response).extracting(CoworkerRequest::memberId)
                .containsExactlyInAnyOrder(other.getId(), another.getId());
    }

    @Test
    @DisplayName("listSent - 보낸 요청이 있을 때 조회하면 받은 회원 id 목록을 반환한다")
    void listSent_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val another = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(member.getId(), other.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(member.getId(), another.getId()));
        coworkerRequestRepository.save(CoworkerRequestFactory.entity(other.getId(), member.getId()));

        // when
        val response = coworkerRequestQueryService.listSent(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(response).extracting(CoworkerRequest::memberId)
                .containsExactlyInAnyOrder(other.getId(), another.getId());
    }
}
