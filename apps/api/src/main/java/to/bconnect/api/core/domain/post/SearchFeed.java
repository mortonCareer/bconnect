package to.bconnect.api.core.domain.post;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;
import com.querydsl.jpa.JPAExpressions;
import lombok.val;
import to.bconnect.api.storage.Region;
import to.bconnect.api.storage.post.QPostEntity;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.QProfileEntity;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.QTaskEntity;

import java.time.LocalDate;
import java.util.Set;

public record SearchFeed(
        Set<ProfileRole> role,
        Set<Trade> trades,
        Integer minExperience,
        Integer maxExperience,
        Set<Region> states,
        LocalDate start,
        LocalDate end
) {
    public Predicate toPredicate() {
        return new BooleanBuilder()
                .and(profilePredicate())
                .and(taskPredicate());
    }

    private Predicate profilePredicate() {
        val post = QPostEntity.postEntity;
        val profile = QProfileEntity.profileEntity;

        val conditions = new BooleanBuilder();
        if (role != null && !role.isEmpty())
            conditions.and(profile.role.in(role));
        if (trades != null && !trades.isEmpty())
            conditions.and(profile.trades.any().in(trades));
        if (minExperience != null)
            conditions.and(profile.experience.goe(minExperience));
        if (maxExperience != null)
            conditions.and(profile.experience.loe(maxExperience));
        if (states != null && !states.isEmpty())
            conditions.and(profile.address.state.in(states));

        if (!conditions.hasValue())
            return null;

        return JPAExpressions.selectOne()
                .from(profile)
                .where(profile.memberId.eq(post.memberId), conditions)
                .exists();
    }

    private Predicate taskPredicate() {
        val post = QPostEntity.postEntity;
        val task = QTaskEntity.taskEntity;

        val conditions = new BooleanBuilder();
        if (start != null)
            conditions.and(task.start.goe(start));
        if (end != null)
            conditions.and(task.end.loe(end));

        if (!conditions.hasValue())
            return null;

        return JPAExpressions.selectOne()
                .from(task)
                .where(task.id.eq(post.taskId), conditions)
                .exists();
    }
}
