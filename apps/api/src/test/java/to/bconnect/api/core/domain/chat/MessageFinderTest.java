package to.bconnect.api.core.domain.chat;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class MessageFinderTest {

    @Autowired private MessageFinder messageFinder;
    @Autowired private MessageRepository messageRepository;
    @Autowired private DirectChatRepository directChatRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private GroupChatFactory groupChatFactory;
    @Autowired private ParticipantFactory participantFactory;
    @Autowired private MessageFactory messageFactory;

    @Test
    @DisplayName("unreadCount - DM과 그룹 채팅의 미읽음 메시지가 합산된다")
    void unreadCount_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("msg-unread1a", "01000007001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("msg-unread1b", "01000007002", Role.CAREER));

        val directChat = directChatRepository.save(DirectChatFactory.entity(member.getId(), other.getId()));
        val directMessage = new MessageEntity(
                directChat.getId(), ChatType.DIRECT, other.getId(), MessageType.TEXT, "content");
        messageRepository.save(directMessage);

        val groupChat = groupChatFactory.entity();
        participantFactory.entity(groupChat.getId(), member.getId());
        messageFactory.entity(groupChat.getId(), other.getId());
        messageFactory.entity(groupChat.getId(), other.getId());

        // when
        val count = messageFinder.unreadCount(member.getId());

        // then
        assertThat(count).isEqualTo(3L);
    }

    @Test
    @DisplayName("unreadCount - 읽음 처리한 메시지는 제외된다")
    void unreadCount_success_read() {
        // given
        val member = memberRepository.save(MemberFactory.entity("msg-unread2a", "01000007003", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("msg-unread2b", "01000007004", Role.CAREER));

        val directChat = directChatRepository.save(DirectChatFactory.entity(member.getId(), other.getId()));
        val directMessage = new MessageEntity(
                directChat.getId(), ChatType.DIRECT, other.getId(), MessageType.TEXT, "content");
        messageRepository.save(directMessage);
        directChat.markRead(member.getId(), directMessage.getId());

        // when
        val count = messageFinder.unreadCount(member.getId());

        // then
        assertThat(count).isZero();
    }

    @Test
    @DisplayName("unreadCount - 참여 중인 채팅이 없으면 0을 반환한다")
    void unreadCount_success_empty() {
        // given
        val member = memberRepository.save(MemberFactory.entity("msg-unread3a", "01000007005", Role.CAREER));

        // when
        val count = messageFinder.unreadCount(member.getId());

        // then
        assertThat(count).isZero();
    }
}
