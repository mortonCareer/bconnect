package to.bconnect.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.presentation.v1.request.CreateChatRequest;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;
import to.bconnect.api.storage.domain.chat.ChatEntity;
import to.bconnect.api.storage.domain.chat.ChatRepository;
import to.bconnect.api.storage.domain.chat.MessageEntity;
import to.bconnect.api.storage.domain.chat.MessageRepository;
import to.bconnect.api.storage.domain.chat.ParticipantEntity;
import to.bconnect.api.storage.domain.chat.ParticipantRepository;
import to.bconnect.api.storage.value.MessageType;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.User;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatFinder chatFinder;
    private final MessageFinder messageFinder;
    private final MemberFinder memberFinder;
    private final ChatRepository chatRepository;
    private final ParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public List<ChatDetail> list(Long memberId) {
        List<Chat> chats = chatFinder.findAll(memberId);

        if (chats.isEmpty()) return List.of();

        List<Long> memberIds = chats.stream()
                .flatMap(chat -> chat.participantIds().stream())
                .distinct()
                .toList();

        Map<Long, Member> members = memberFinder.findAllByIds(memberIds).stream()
                .collect(Collectors.toMap(Member::id, Function.identity()));

        return chats.stream()
                .map(chat -> new ChatDetail(
                        chat.id(),
                        chat.title(),
                        chat.participantIds().stream()
                                .map(members::get)
                                .filter(Objects::nonNull)
                                .toList(),
                        chat.lastMessage(),
                        chat.unreadCount(),
                        chat.createdAt(),
                        chat.modifiedAt()
                )).toList();
    }

    @Transactional
    public ChatDetail create(User user, CreateChatRequest request) {
        Long memberId = user.id();
        List<Long> participantIds = request.participantIds().stream().distinct().toList();

        if (!participantIds.contains(memberId))
            throw new CodeException(ChatExceptionCode.SELF_NOT_INCLUDED);

        List<Member> members = memberFinder.findAllByIds(participantIds);
        if (members.size() != participantIds.size())
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        ChatEntity chat = chatRepository.save(ChatEntity.builder()
                .title(request.title())
                .build());

        List<ParticipantEntity> participants = participantIds.stream()
                .map(id -> ParticipantEntity.builder()
                        .chatId(chat.getId())
                        .memberId(id)
                        .build())
                .toList();
        participantRepository.saveAll(participants);

        MessageEntity welcome = messageRepository.save(MessageEntity.builder()
                .chatId(chat.getId())
                .memberId(Member.SYSTEM_ID)
                .type(MessageType.SYSTEM)
                .content("채팅방이 생성되었습니다.") // TODO: 상수 분리
                .build());

        return new ChatDetail(
                chat.getId(),
                chat.getTitle(),
                members,
                Message.of(welcome),
                0L,
                chat.getCreatedAt(),
                chat.getModifiedAt()
        );
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> listMessages(User user, Long chatId, CursorLimit cursor) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, user.id()))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        CursorLimit fetchCursor = new CursorLimit(
                cursor.cursor(),
                cursor.limit() + 1,
                cursor.reverse()
        );

        List<Message> messages = messageFinder.findAllByChatId(chatId, fetchCursor);

        boolean hasNext = messages.size() > cursor.limit();
        List<Message> content = hasNext ? messages.subList(0, cursor.limit()) : messages;
        Long nextCursor = hasNext ? content.getLast().id() : null;

        return new CursorPage<>(content, nextCursor, hasNext);
    }
}
