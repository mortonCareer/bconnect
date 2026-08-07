package to.bconnect.api.core.domain.chat;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.GroupChatRepository;
import to.bconnect.api.storage.chat.MessageRepository;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.GroupChatFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.MessageFactory;
import to.bconnect.api.support.fixture.ParticipantFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class GroupChatServiceTest {

    @Autowired private GroupChatService groupChatService;
    @Autowired private GroupChatRepository groupChatRepository;
    @Autowired private ParticipantRepository participantRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private GroupChatFactory groupChatFactory;
    @Autowired private ParticipantFactory participantFactory;
    @Autowired private MessageFactory messageFactory;

    @Test
    @DisplayName("leave - 다른 참여자가 남아있을 때 나가면 참여자만 삭제된다")
    void leave_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val chat = groupChatFactory.entity();
        participantFactory.entity(chat.getId(), member.getId());
        participantFactory.entity(chat.getId(), other.getId());
        val message = messageFactory.entity(chat.getId(), member.getId());

        // when
        groupChatService.leave(member.getId(), chat.getId());

        // then
        assertThat(participantRepository.findByChatIdAndMemberId(chat.getId(), member.getId())).isEmpty();
        assertThat(participantRepository.findByChatIdAndMemberId(chat.getId(), other.getId())).isPresent();
        assertThat(groupChatRepository.findById(chat.getId())).isPresent();
        assertThat(messageRepository.findById(message.getId())).isPresent();
    }

    @Test
    @DisplayName("leave - 마지막 참여자일 때 나가면 채팅방과 메시지가 삭제된다")
    void leave_success_last() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val chat = groupChatFactory.entity();
        participantFactory.entity(chat.getId(), member.getId());
        val message = messageFactory.entity(chat.getId(), member.getId());

        // when
        groupChatService.leave(member.getId(), chat.getId());

        // then
        assertThat(participantRepository.findByChatIdAndMemberId(chat.getId(), member.getId())).isEmpty();
        assertThat(groupChatRepository.findById(chat.getId())).isEmpty();
        assertThat(messageRepository.findById(message.getId())).isEmpty();
    }

    @Test
    @DisplayName("leave - 참여자가 아닐 때 나가면 FORBIDDEN으로 실패한다")
    void leave_fail_C004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val chat = groupChatFactory.entity();
        participantFactory.entity(chat.getId(), other.getId());

        // when & then
        assertCodeException(() -> groupChatService.leave(member.getId(), chat.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }
}
