package org.terrakube.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.terrakube.api.rs.workspace.access.Access;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccessRepository extends JpaRepository<Access, UUID> {

    Optional<List<Access>> findAllByWorkspaceOrganizationIdAndNameIn(UUID workspaceOrganizationId, List<String> names);

}
