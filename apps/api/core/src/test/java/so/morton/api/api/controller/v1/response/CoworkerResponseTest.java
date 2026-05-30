package so.morton.api.api.controller.v1.response;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import so.morton.api.domain.coworker.Coworker;
import so.morton.api.domain.member.Member;
import so.morton.api.storage.value.CoworkerStatus;
import so.morton.api.support.fixture.CoworkerFactory;
import so.morton.api.support.fixture.MemberFactory;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CoworkerResponse 테스트")
class CoworkerResponseTest {

    @Test
    @DisplayName("of - Coworker/Member/CoworkerStatus 매핑")
    void of_mapping() {
        // given
        Coworker coworker = CoworkerFactory.create(10L, 1L, 2L);
        Member member = MemberFactory.create(2L);
        CoworkerStatus status = CoworkerStatus.COWORKER;

        // when
        CoworkerResponse result = CoworkerResponse.of(coworker, member, status);

        // then
        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.status()).isEqualTo(CoworkerStatus.COWORKER);
        assertThat(result.member().id()).isEqualTo(member.id());
        assertThat(result.member().username()).isEqualTo(member.username());
        assertThat(result.member().name()).isEqualTo(member.name());
        assertThat(result.member().picture()).isEqualTo(member.picture());
    }
}
