package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.attachment.AttachmentValidator;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.post.PostAttachmentMappingEntity;
import to.bconnect.api.storage.post.PostAttachmentMappingRepository;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostAttachmentMappingRepository postAttachmentMappingRepository;
    private final AttachmentValidator attachmentValidator;

    @Transactional(readOnly = true)
    public List<Post> list() {
        val posts = postRepository.findAll();

        val postIds = posts.stream().map(PostEntity::getId).toList();
        val attachmentIdMap = postAttachmentMappingRepository.findByPostIdIn(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        PostAttachmentMappingEntity::getPostId,
                        Collectors.mapping(PostAttachmentMappingEntity::getAttachmentId, Collectors.toList())
                ));

        return posts.stream()
                .map(it -> Post.of(it, attachmentIdMap.getOrDefault(it.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        val post = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val attachmentIds = postAttachmentMappingRepository.findByPostIdIn(List.of(postId))
                .stream()
                .map(PostAttachmentMappingEntity::getAttachmentId)
                .toList();

        return Post.of(post, attachmentIds);
    }

    @Transactional
    public Long create(AuthUser user, CreatePost command) {
        attachmentValidator.validate(user, command.attachmentIds());

        val created = postRepository.save(new PostEntity(
                user.id(),
                command.taskId(),
                command.content()
        ));

        postAttachmentMappingRepository.saveAll(command.attachmentIds().stream()
                .map(it -> new PostAttachmentMappingEntity(created.getId(), it))
                .toList());

        return created.getId();
    }

    @Transactional
    public void update(AuthUser user, Long postId, String content) {
        val found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long postId) {
        val optional = postRepository.findById(postId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        postAttachmentMappingRepository.deleteByPostId(found.getId());
        postRepository.delete(found);
    }
}
