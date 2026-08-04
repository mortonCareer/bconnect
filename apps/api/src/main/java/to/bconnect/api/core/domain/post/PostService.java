package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final TaskRepository taskRepository;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentLinker attachmentLinker;

    @Transactional(readOnly = true)
    public CursorPage<Post> list(CursorLimit cursor) {
        val posts = postRepository.findAllBy(
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                posts.map(Post::of),
                Post::id
        );
    }

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        return postRepository.findById(postId)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional
    public Long create(AuthUser user, CreatePost command) {
        if (command.taskId() != null) {
            val task = taskRepository.findById(command.taskId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            if (!user.id().equals(task.getWorkerId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        attachmentFinder.validateOwnership(user.id(), command.attachmentIds());

        val created = postRepository.save(new PostEntity(
                user.id(),
                command.taskId(),
                command.content()
        ));

        attachmentLinker.link(AttachmentReferenceType.POST, created.getId(), command.attachmentIds());

        return created.getId();
    }

    @Transactional
    public void update(AuthUser user, Long postId, UpdatePost command) {
        val found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        if (command.taskId() != null) {
            val task = taskRepository.findById(command.taskId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            if (!user.id().equals(task.getWorkerId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        found.update(command.taskId(), command.content());

        attachmentFinder.validateOwnership(user.id(), command.attachmentIds());
        attachmentLinker.unlink(AttachmentReferenceType.POST, List.of(found.getId()));
        attachmentLinker.link(AttachmentReferenceType.POST, found.getId(), command.attachmentIds());
    }

    @Transactional
    public void delete(AuthUser user, Long postId) {
        val optional = postRepository.findById(postId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        attachmentLinker.unlink(AttachmentReferenceType.POST, found.getId());
        postRepository.delete(found);
    }
}
