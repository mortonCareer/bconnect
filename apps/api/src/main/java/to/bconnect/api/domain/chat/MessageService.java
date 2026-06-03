package to.bconnect.api.domain.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.api.controller.v1.request.SendMessageRequest;
import to.bconnect.api.storage.domain.chat.MessageEntity;
import to.bconnect.api.storage.domain.chat.MessageRepository;
import to.bconnect.api.storage.domain.chat.ParticipantRepository;
import to.bconnect.api.storage.domain.member.MemberRepository;
import to.bconnect.api.storage.common.value.MessageType;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.security.User;
import to.bconnect.api.support.ws.WebSocketAuthorizationConfig;

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
