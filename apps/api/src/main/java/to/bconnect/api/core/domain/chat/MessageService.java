package to.bconnect.api.core.domain.chat;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.storage.chat.*;
import to.bconnect.api.storage.member.MemberEntity;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageAttachmentMappingRepository messageAttachmentMappingRepository;

    @Transactional
    public void create(Long chatId, ChatType type, Long senderId, SendMessage command) {
        val created = messageRepository.save(new MessageEntity(
                chatId, type, senderId, command.type(), command.content()));

        val attachmentIds = command.attachmentIds();
        if (!attachmentIds.isEmpty())
            messageAttachmentMappingRepository.saveAll(attachmentIds.stream()
                    .map(it -> new MessageAttachmentMappingEntity(created.getId(), it))
                    .toList());
    }

    @Transactional
    public void createSystemMessage(Long chatId, ChatType type, String content) {
        messageRepository.save(new MessageEntity(
                chatId,
                type,
                MemberEntity.SYSTEM_ID,
                MessageType.SYSTEM,
                content
        ));
    }

    @Transactional(readOnly = true)
    public CursorPage<Message> list(Long chatId, ChatType type, CursorLimit cursor) {
        val messages = messageRepository.findAllByChatIdAndChatType(
                chatId,
                type,
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
