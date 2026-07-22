package to.bconnect.api.core.domain.chat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.support.IntegrationTest;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class MessageServiceTest {

    @Autowired private MessageService messageService;
    @Autowired private MessageRepository messageRepository;
    @Autowired private DirectChatRepository directChatRepository;
    @Autowired private GroupChatRepository groupChatRepository;
    @Autowired private ParticipantRepository participantRepository;
    @Autowired private MemberRepository memberRepository;

    private Long memberA;
    private Long memberB;

    @BeforeEach
    void setUp() {
        // direct_chats·participants·messages 는 members FK 를 강제한다.
        memberA = saveMember();
        memberB = saveMember();
    }

    @Test
    @DisplayName("DIRECT 읽음 처리는 지정한 회원의 읽음 위치만 갱신한다")
    void markRead_direct_updatesOnlyGivenMember() {
        // identity 순번상 memberA < memberB 라 minId=memberA, maxId=memberB
        var chat = directChatRepository.save(DirectChatEntity.of(memberA, memberB));
        var message = saveMessage(chat.getId(), ChatType.DIRECT, memberA);

        messageService.markRead(chat.getId(), ChatType.DIRECT, Set.of(memberB), message.getId());

        var found = directChatRepository.findById(chat.getId()).orElseThrow();
        assertThat(found.getMaxLastIdx()).isEqualTo(message.getId());
        assertThat(found.getMinLastIdx()).isZero();
    }

    @Test
    @DisplayName("GROUP 읽음 처리는 지정한 참여자의 읽음 위치만 갱신한다")
    void markRead_group_updatesOnlyGivenParticipants() {
        var chatId = saveGroupChat();
        var read = participantRepository.save(new ParticipantEntity(chatId, memberA));
        var unread = participantRepository.save(new ParticipantEntity(chatId, memberB));
        var message = saveMessage(chatId, ChatType.GROUP, memberB);

        messageService.markRead(chatId, ChatType.GROUP, Set.of(memberA), message.getId());

        assertThat(participantRepository.findById(read.getId()).orElseThrow().getLastIdx())
                .isEqualTo(message.getId());
        assertThat(participantRepository.findById(unread.getId()).orElseThrow().getLastIdx())
                .isZero();
    }

    @Test
    @DisplayName("DIRECT 구독 시 읽음 처리는 마지막 메시지 위치로 갱신한다")
    void markReadLatest_direct_updatesToLastMessage() {
        var chat = directChatRepository.save(DirectChatEntity.of(memberA, memberB));
        saveMessage(chat.getId(), ChatType.DIRECT, memberA);
        var last = saveMessage(chat.getId(), ChatType.DIRECT, memberA);

        messageService.markReadLatest(chat.getId(), ChatType.DIRECT, memberB);

        assertThat(directChatRepository.findById(chat.getId()).orElseThrow().getMaxLastIdx())
                .isEqualTo(last.getId());
    }

    @Test
    @DisplayName("GROUP 구독 시 읽음 처리는 마지막 메시지 위치로 갱신한다")
    void markReadLatest_group_updatesToLastMessage() {
        var chatId = saveGroupChat();
        var participant = participantRepository.save(new ParticipantEntity(chatId, memberA));
        saveMessage(chatId, ChatType.GROUP, memberB);
        var last = saveMessage(chatId, ChatType.GROUP, memberB);

        messageService.markReadLatest(chatId, ChatType.GROUP, memberA);

        assertThat(participantRepository.findById(participant.getId()).orElseThrow().getLastIdx())
                .isEqualTo(last.getId());
    }

    @Test
    @DisplayName("메시지가 없는 채팅방의 구독 시 읽음 처리는 읽음 위치를 바꾸지 않는다")
    void markReadLatest_emptyChat_keepsPosition() {
        var chat = directChatRepository.save(DirectChatEntity.of(memberA, memberB));

        messageService.markReadLatest(chat.getId(), ChatType.DIRECT, memberB);

        assertThat(directChatRepository.findById(chat.getId()).orElseThrow().getMaxLastIdx())
                .isZero();
    }

    @Test
    @DisplayName("DIRECT 참여자 조회는 minId·maxId 두 회원을 반환한다")
    void findParticipantIds_direct_returnsBothMembers() {
        var chat = directChatRepository.save(DirectChatEntity.of(memberB, memberA));

        assertThat(messageService.findParticipantIds(chat.getId(), ChatType.DIRECT))
                .containsExactlyInAnyOrder(memberA, memberB);
    }

    @Test
    @DisplayName("GROUP 참여자 조회는 참여자 전원을 반환한다")
    void findParticipantIds_group_returnsAllParticipants() {
        var chatId = saveGroupChat();
        participantRepository.saveAll(List.of(
                new ParticipantEntity(chatId, memberA),
                new ParticipantEntity(chatId, memberB)));

        assertThat(messageService.findParticipantIds(chatId, ChatType.GROUP))
                .containsExactlyInAnyOrder(memberA, memberB);
    }

    private Long saveMember() {
        var uniq = UUID.randomUUID().toString();
        return memberRepository.save(
                new MemberEntity("u-" + uniq, "회원", "p-" + uniq, Role.USER)).getId();
    }

    private Long saveGroupChat() {
        return groupChatRepository.save(new GroupChatEntity("채팅방")).getId();
    }

    private MessageEntity saveMessage(Long chatId, ChatType type, Long memberId) {
        return messageRepository.saveAndFlush(
                new MessageEntity(chatId, type, memberId, MessageType.TEXT, "hello"));
    }
}
