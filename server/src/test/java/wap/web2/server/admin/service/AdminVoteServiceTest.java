package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.repository.BallotRepository;

@SpringJUnitConfig(AdminVoteServiceTest.Config.class)
class AdminVoteServiceTest {
    @Configuration
    @EnableCaching
    static class Config {
        @Bean VoteMetaRepository metas() { return mock(VoteMetaRepository.class); }
        @Bean ProjectRepository projects() { return mock(ProjectRepository.class); }
        @Bean BallotRepository ballots() { return mock(BallotRepository.class); }
        @Bean CacheManager cacheManager() { return new ConcurrentMapCacheManager("voteResults"); }
        @Bean AdminVoteService service(VoteMetaRepository metas, ProjectRepository projects, BallotRepository ballots) {
            return new AdminVoteService(metas, projects, ballots);
        }
    }

    @Autowired AdminVoteService service;
    @Autowired VoteMetaRepository metas;
    @Autowired ProjectRepository projects;
    @Autowired BallotRepository ballots;
    @Autowired CacheManager cacheManager;
    private static final String SEMESTER = "2026-02";

    @BeforeEach void resetState() {
        reset(metas, projects, ballots);
        cacheManager.getCache("voteResults").clear();
    }

    @Test void reopenPreservesParticipantsAndBallotsAndHidesCachedResults() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 9, 1, 12, 0);
        var participants = new ArrayList<>(List.of(10L, 20L));
        var meta = new VoteMeta(1L, SEMESTER, VoteStatus.ENDED, 2L, createdAt,
            3L, createdAt.plusDays(1), true, participants);
        when(metas.findBySemester(SEMESTER)).thenReturn(Optional.of(meta));
        var cache = cacheManager.getCache("voteResults");
        cache.put(SEMESTER, "old results");
        cache.put("latest", "old results");

        service.reopenVote(SEMESTER);

        assertThat(meta.getStatus()).isEqualTo(VoteStatus.VOTING);
        assertThat(meta.getParticipants()).isSameAs(participants).containsExactly(10L, 20L);
        assertThat(meta.getCreatedAt()).isEqualTo(createdAt);
        assertThat(meta.getCreatedBy()).isEqualTo(2L);
        assertThat(meta.getClosedAt()).isNull();
        assertThat(meta.getClosedBy()).isNull();
        assertThat(meta.isResultPublic()).isFalse();
        assertThat(cache.get(SEMESTER)).isNull();
        assertThat(cache.get("latest")).isNull();
        verifyNoInteractions(ballots, projects);
        verify(metas, never()).save(any());
    }

    @ParameterizedTest
    @EnumSource(value = VoteStatus.class, names = {"NOT_CREATED", "VOTING"})
    void rejectsVotesThatHaveNotEnded(VoteStatus status) {
        var meta = new VoteMeta(1L, SEMESTER, status, 2L, null, null, null, false, new ArrayList<>());
        when(metas.findBySemester(SEMESTER)).thenReturn(Optional.of(meta));
        assertThatThrownBy(() -> service.reopenVote(SEMESTER)).isInstanceOf(ConflictException.class);
        assertThat(meta.getStatus()).isEqualTo(status);
        verifyNoInteractions(ballots, projects);
    }

    @Test void rejectsMissingVote() {
        when(metas.findBySemester(SEMESTER)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.reopenVote(SEMESTER)).isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(ballots, projects);
    }
}
