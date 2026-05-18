package com.rentsafe.repository;

import com.rentsafe.entity.IdentityProof;
import com.rentsafe.entity.IdentityProof.ProofStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IdentityProofRepository extends JpaRepository<IdentityProof, String> {

    // Find proofs by user
    List<IdentityProof> findByUserId(String userId);

    // Find verified proofs for a user
    List<IdentityProof> findByUserIdAndStatus(String userId, ProofStatus status);

    // Find proofs by status
    List<IdentityProof> findByStatus(ProofStatus status);

    // Grouping support
    List<IdentityProof> findByUserIdIn(List<String> userIds);
}
