package so.morton.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.SendMessageRequest;
import so.morton.api.storage.domain.chat.MessageEntity;
import so.morton.api.storage.domain.chat.MessageRepository;
import so.morton.api.storage.domain.chat.ParticipantRepository;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.value.MessageType;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;
import so.morton.api.support.ws.WebSocketAuthorizationConfig;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ParticipantRepository participantRepository;
    private final MemberRepository memberRepository;
    private final SimpUserRegistry simpUserRegistry;

    @Transactional
    public Message broadcast(User user, Long chatId, SendMessageRequest request) {
        if (request.type() == MessageType.SYSTEM)
            throw new CodeException(CommonExceptionCode.NOT_VALID);

        MessageEntity entity = messageRepository.save(MessageEntity.builder()
                .chatId(chatId)
                .memberId(user.id())
                .type(request.type())
                .content(request.content())
                .build());

        String dest = WebSocketAuthorizationConfig.CHAT_TOPIC_PREFIX + chatId;
        Set<String> usernames = simpUserRegistry
                .findSubscriptions(sub -> dest.equals(sub.getDestination()))
                .stream()
                .map(sub -> sub.getSession().getUser().getName())
                .collect(Collectors.toCollection(HashSet::new));

        List<Long> memberIds = memberRepository.findIdsByUsernameIn(usernames);
        participantRepository.updateLastIdxIn(chatId, memberIds, entity.getId());

        return Message.of(entity);
    }
}
