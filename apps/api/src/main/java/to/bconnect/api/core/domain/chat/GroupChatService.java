package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberRepository;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupChatService {

    private final GroupChatRepository groupChatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final DirectChatRepository directChatRepository;
    private final MessageFinder messageFinder;
    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<GroupChat> list(Long memberId) {
        val chatIds = participantRepository.findAllByMemberId(memberId)
                .stream().map(ParticipantEntity::getChatId).toList();
        if (chatIds.isEmpty()) return List.of();

        val chats = groupChatRepository.findAllById(chatIds);

        val participantMap = participantRepository.findAllByChatIdIn(chatIds)
                .stream()
                .collect(Collectors.groupingBy(
                        ParticipantEntity::getChatId,
                        Collectors.mapping(ParticipantEntity::getMemberId, Collectors.toList())
                ));

        val lastMessageMap = messageRepository.findLatestMessagesByChatIdInAndChatType(chatIds, ChatType.GROUP)
                .stream()
                .collect(Collectors.toMap(MessageEntity::getChatId, Message::of));

        val unreadCountMap = messageRepository.findGroupUnreadCountByChatIdsAndMemberId(chatIds, memberId);

        return chats.stream()
                .map(it -> GroupChat.of(
                        it,
                        participantMap.getOrDefault(it.getId(), List.of()),
                        lastMessageMap.get(it.getId()),
                        unreadCountMap.getOrDefault(it.getId(), 0L)
                ))
                .sorted(Comparator.comparing(
                        (GroupChat it) -> it.lastMessage() == null
                                ? it.createdAt()
                                : it.lastMessage().createdAt()).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupChat get(Long memberId, Long chatId) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        val chat = groupChatRepository.findById(chatId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));

        val participantIds = participantRepository.findMemberIdsByChatId(chatId);
        val lastMessage = messageRepository.findFirstByChatIdAndChatTypeOrderByIdDesc(chatId, ChatType.GROUP)
                .map(Message::of).orElse(null);
        val unreadCount = messageRepository.findGroupUnreadCountByChatIdAndMemberId(chatId, memberId);

        return GroupChat.of(chat, participantIds, lastMessage, unreadCount);
    }

    @Transactional
    public Long create(AuthUser user, CreateGroupChat command) {
        val participantIds = command.participantIds().stream().distinct().toList();

        if (!participantIds.contains(user.id()))
            throw new CodeException(ChatExceptionCode.SELF_NOT_INCLUDED);
        if (memberRepository.findAllByIdIn(participantIds).size() != participantIds.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        val created = groupChatRepository.save(new GroupChatEntity(command.title()));

        participantRepository.saveAll(participantIds.stream()
                .map(it -> new ParticipantEntity(created.getId(), it))
                .toList());

        eventPublisher.publishEvent(new ChatCreatedEvent(created.getId(), ChatType.GROUP));

        return created.getId();
    }

    @Transactional
    public void leave(Long memberId, Long chatId) {
        val found = participantRepository.findByChatIdAndMemberId(chatId, memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));

        participantRepository.delete(found);

        if (participantRepository.countByChatId(chatId) > 0) return;

        messageRepository.deleteAllByChatIdAndChatType(chatId, ChatType.GROUP);
        groupChatRepository.deleteById(chatId);
    }

    @Transactional(readOnly = true)
    public Set<Long> findParticipantIds(Long chatId, ChatType type) {
        if (type == ChatType.DIRECT) {
            val chat = directChatRepository.findById(chatId)
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            return Set.of(chat.getMaxId(), chat.getMinId());
        }

        return new HashSet<>(participantRepository.findMemberIdsByChatId(chatId));
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> listMessages(AuthUser user, Long chatId, CursorLimit cursor) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return messageFinder.list(chatId, ChatType.GROUP, cursor);
    }
}
