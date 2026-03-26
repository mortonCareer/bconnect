package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.value.Role;

@Component
public class MemberFactory {

    @Autowired private MemberRepository memberRepository;

    public MemberEntity create(String username, String phone) {
        return memberRepository.save(MemberEntity.builder()
                .username(username)
                .phone(phone)
                .name("name")
                .picture("picture")
                .role(Role.SKILLED)
                .build());
    }
}
