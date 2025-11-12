package wap.web2.server.vote.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wap.web2.server.vote.entity.Ballot;

@Repository
public interface BallotRepository extends JpaRepository<Ballot, Long> {
}
