package so.morton.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateChatRequest;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberFinder;
import so.morton.api.storage.domain.chat.ChatEntity;
import so.morton.api.storage.domain.chat.ChatRepository;
import so.morton.api.storage.domain.chat.MessageEntity;
import so.morton.api.storage.domain.chat.MessageRepository;
import so.morton.api.storage.domain.chat.ParticipantEntity;
import so.morton.api.storage.domain.chat.ParticipantRepository;
import so.morton.api.storage.value.MessageType;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.request.CursorLimit;
import so.morton.api.support.response.CursorPage;

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
    public List<ChatDetail> getMyChats(Long memberId) {
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
    public CursorPage<Message> getMessages(User user, Long chatId, CursorLimit cursor) {
        if (!participantRepository.existsByChatIdAndMemberId(chatId, user.id()))
            throw new CodeException(ChatExceptionCode.NOT_PARTICIPANT);

        CursorLimit fetchCursor = new CursorLimit(
                cursor.cursor(),
                cursor.limit() + 1,
                cursor.reverse()
        );

        List<Message> messages = messageFinder.findByChatId(chatId, fetchCursor);

        boolean hasNext = messages.size() > cursor.limit();
        List<Message> content = hasNext ? messages.subList(0, cursor.limit()) : messages;
        Long nextCursor = hasNext ? content.getLast().id() : null;

        return new CursorPage<>(content, nextCursor, hasNext);
    }
}
