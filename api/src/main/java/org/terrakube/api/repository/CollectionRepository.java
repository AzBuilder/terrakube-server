package org.terrakube.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.terrakube.api.rs.collection.Collection;

import java.util.UUID;

public interface CollectionRepository extends JpaRepository<Collection, UUID> {
}