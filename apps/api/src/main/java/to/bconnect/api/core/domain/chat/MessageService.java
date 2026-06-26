package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.storage.chat.ChatType;
import to.bconnect.api.storage.chat.MessageAttachmentMappingEntity;
import to.bconnect.api.storage.chat.MessageAttachmentMappingRepository;
import to.bconnect.api.storage.chat.MessageEntity;
import to.bconnect.api.storage.chat.MessageRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageAttachmentMappingRepository messageAttachmentMappingRepository;

    @Transactional(readOnly = true)
    public CursorPage<Message> list(Long chatId, ChatType chatType, CursorLimit cursor) {
        val messages = messageRepository.findAllByChatIdAndChatType(
                chatId,
                chatType,
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        val messageIds = messages.getContent().stream().map(MessageEntity::getId).toList();
        val attachmentIdMap = messageAttachmentMappingRepository.findByMessageIdIn(messageIds)
                .stream()
                .collect(Collectors.groupingBy(
                        MessageAttachmentMappingEntity::getMessageId,
                        Collectors.mapping(MessageAttachmentMappingEntity::getAttachmentId, Collectors.toList())
                ));

        return CursorPage.from(
                messages.map(it -> Message.of(it, attachmentIdMap.getOrDefault(it.getId(), List.of()))),
                Message::id
        );
    }
}
