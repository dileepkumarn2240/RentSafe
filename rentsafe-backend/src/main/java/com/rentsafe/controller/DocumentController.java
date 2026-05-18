package com.rentsafe.controller;

import com.rentsafe.entity.IdentityProof;
import com.rentsafe.entity.Property;
import com.rentsafe.entity.TenantDocument;
import com.rentsafe.entity.Unit;
import com.rentsafe.entity.User;
import com.rentsafe.repository.PropertyRepository;
import com.rentsafe.repository.UnitRepository;
import com.rentsafe.repository.UserRepository;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.DocumentService;
import com.rentsafe.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private TenantService tenantService;

    @Autowired
    private PropertyRepository propertyRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('TENANT') or hasAuthority('OWNER')")
    public ResponseEntity<?> getMyDocuments(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        String userId = userDetails.getId();
        if (userId == null) throw new RuntimeException("Error: User ID is null.");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));
        return ResponseEntity.ok(documentService.getDocumentsByUser(user));
    }

    @GetMapping("/identity")
    @PreAuthorize("hasAuthority('TENANT') or hasAuthority('OWNER')")
    public ResponseEntity<?> getMyIdentity(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        String userId = userDetails.getId();
        if (userId == null) throw new RuntimeException("Error: User ID is null.");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));
        return ResponseEntity.ok(documentService.getIdentityProofsByUser(user));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> getPendingDocuments() {
        return ResponseEntity.ok(documentService.getPendingDocuments());
    }

    @GetMapping("/identity/pending")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> getPendingIdentity() {
        return ResponseEntity.ok(documentService.getPendingIdentityProofs());
    }

    @GetMapping("/matrix")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> getDocumentsMatrix(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        String ownerId = userDetails.getId();
        List<User> tenants = tenantService.getTenantsByOwner(ownerId);
        List<String> userIds = tenants.stream().map(User::getId).collect(Collectors.toList());

        List<IdentityProof> identities = documentService.getIdentityProofsByUserIds(userIds);
        List<TenantDocument> docs = documentService.getDocumentsByUserIds(userIds);

        List<Map<String, Object>> matrix = tenants.stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("tenantId", t.getId());
            map.put("name", t.getName());
            
            try {
                Unit u = tenantService.getTenantUnit(t.getId());
                map.put("house", u.getProperty().getName() + " - " + u.getName());
                map.put("unitId", u.getId());
                map.put("agreementType", u.getAgreementType() != null ? u.getAgreementType().name() : "RENTAL");
            } catch (Exception e) {
                map.put("house", "Unassigned");
                map.put("unitId", null);
                map.put("agreementType", "RENTAL");
            }

            map.put("identity", identities.stream().filter(i -> i.getUser().getId().equals(t.getId())).collect(Collectors.toList()));
            map.put("legal", docs.stream().filter(d -> d.getUser().getId().equals(t.getId())).collect(Collectors.toList()));
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(matrix);
    }

    @GetMapping("/tenants/{tenantId}/identities")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> getTenantIdentities(@PathVariable @org.springframework.lang.NonNull String tenantId) {
        User user = userRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        return ResponseEntity.ok(documentService.getIdentityProofsByUser(user));
    }

    @GetMapping("/tenants/{tenantId}/legal")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> getTenantLegalDocs(@PathVariable @org.springframework.lang.NonNull String tenantId) {
        User user = userRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        return ResponseEntity.ok(documentService.getDocumentsByUser(user));
    }

    @PostMapping("/upload/identity")
    @PreAuthorize("hasAuthority('TENANT') or hasAuthority('OWNER')")
    public ResponseEntity<?> uploadIdentity(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("type") IdentityProof.ProofType type,
            @RequestParam("number") String number,
            @RequestParam("fullName") String fullName,
            @RequestParam("dob") String dob,
            @RequestParam("address") String address,
            @RequestParam("frontFile") MultipartFile frontFile,
            @RequestParam(value = "backFile", required = false) MultipartFile backFile) throws IOException {

        String userId = userDetails.getId();
        if (userId == null) throw new RuntimeException("Error: User ID is null.");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        // Safeguard for parameters
        IdentityProof.ProofType proofType = (type != null) ? type : IdentityProof.ProofType.OTHER;
        String proofNumber = (number != null) ? number : "UNKNOWN";
        String proofName = (fullName != null) ? fullName : user.getName();
        LocalDate proofDob = (dob != null) ? LocalDate.parse(dob) : LocalDate.now();
        String proofAddress = (address != null) ? address : "";

        IdentityProof proof = documentService.uploadIdentityProof(user, proofType, proofNumber, proofName, 
                proofDob, proofAddress, frontFile, backFile);
        return ResponseEntity.ok(proof);
    }

    @PostMapping("/upload/legal")
    @PreAuthorize("hasAuthority('TENANT') or hasAuthority('OWNER')")
    public ResponseEntity<?> uploadLegal(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam("type") TenantDocument.DocumentType type,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file) throws IOException {

        String userId = userDetails.getId();
        if (userId == null)
            throw new RuntimeException("Error: User ID is null.");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        TenantDocument doc = documentService.uploadTenantDocument(user, type, name, file);
        return ResponseEntity.ok(doc);
    }
    @PutMapping("/{docId}/status")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<TenantDocument> updateStatus(
            @PathVariable String docId,
            @RequestParam("status") TenantDocument.DocumentStatus status) {
        return ResponseEntity.ok(documentService.updateDocumentStatus(docId, status));
    }

    @PutMapping("/identity/{proofId}/status")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<IdentityProof> updateIdentityStatus(
            @PathVariable @org.springframework.lang.NonNull String proofId,
            @RequestParam("status") @org.springframework.lang.NonNull IdentityProof.ProofStatus status,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String ownerId = userDetails.getId();
        if (ownerId == null) throw new RuntimeException("Unauthorized");
        return ResponseEntity.ok(documentService.updateIdentityStatus(proofId, status, ownerId));
    }

    // ─── Unit-Scoped Endpoints ─────────────────────────────────────────────────

    /** Get all documents for a specific unit (owner or assigned tenant) */
    @GetMapping("/units/{unitId}")
    @PreAuthorize("hasAuthority('OWNER') or hasAuthority('TENANT')")
    public ResponseEntity<?> getUnitDocuments(
            @PathVariable String unitId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(documentService.getDocumentsByUnit(unitId));
    }

    /** Upload an agreement or identity doc scoped to a unit */
    @PostMapping("/units/{unitId}/upload")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> uploadUnitDocument(
            @PathVariable String unitId,
            @RequestParam("type") TenantDocument.DocumentType type,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) throws IOException {

        String userId = userDetails.getId();
        if (userId == null) throw new IllegalArgumentException("User ID is required");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (unitId == null) throw new IllegalArgumentException("Unit ID is required");
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found: " + unitId));

        TenantDocument doc = documentService.uploadDocumentForUnit(user, unit, type, name, file);
        return ResponseEntity.ok(doc);
    }

    /** Download the actual file bytes */
    @GetMapping("/{docId}/download")
    @PreAuthorize("hasAuthority('OWNER') or hasAuthority('TENANT')")
    public ResponseEntity<Resource> getDocumentDownload(
            @PathVariable String docId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        TenantDocument doc = documentService.getDocumentById(docId);
        if (doc.getFilePath() == null) throw new RuntimeException("File path is missing for document: " + docId);
        try {
            Path filePath = Paths.get(".").resolve(doc.getFilePath()).normalize();
            URI uri = filePath.toUri();
            if (uri == null) throw new RuntimeException("Could not generate URI for file: " + doc.getFilePath());
            Resource resource = new UrlResource(uri);

            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                if (filePath.toString().toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
                if (filePath.toString().toLowerCase().endsWith(".jpg") || filePath.toString().toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
                if (filePath.toString().toLowerCase().endsWith(".png")) contentType = "image/png";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getName() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read file: " + doc.getFilePath());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error downloading file: " + e.getMessage());
        }
    }

    // ─── Property-Scoped Endpoints ──────────────────────────────────────────────

    /** Get all documents for a specific property */
    @GetMapping("/properties/{propertyId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> getPropertyDocuments(@PathVariable String propertyId) {
        return ResponseEntity.ok(documentService.getDocumentsByProperty(propertyId));
    }

    /** Upload a document for a property */
    @PostMapping("/properties/{propertyId}/upload")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> uploadPropertyDocument(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String propertyId,
            @RequestParam("type") TenantDocument.DocumentType type,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file) throws IOException {

        String userId = userDetails.getId();
        if (userId == null) throw new IllegalArgumentException("User ID is required");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));

        if (propertyId == null) throw new IllegalArgumentException("Property ID is required");
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: Property does not belong to user");
        }

        return ResponseEntity.ok(documentService.uploadDocumentForProperty(user, property, type, name, file));
    }

    @DeleteMapping("/{docId}")
    @PreAuthorize("hasAuthority('OWNER') or hasAuthority('TENANT')")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable String docId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        documentService.deleteDocument(docId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/identity/{proofId}")
    @PreAuthorize("hasAuthority('OWNER') or hasAuthority('TENANT')")
    public ResponseEntity<Void> deleteIdentityProof(
            @PathVariable String proofId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        documentService.deleteIdentityProof(proofId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    /** Download identity proof file */
    @GetMapping("/identity/{proofId}/download/{side}")
    @PreAuthorize("hasAuthority('OWNER') or hasAuthority('TENANT')")
    public ResponseEntity<Resource> getIdentityProofDownload(
            @PathVariable String proofId,
            @PathVariable String side,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        IdentityProof proof = documentService.getIdentityProofById(proofId);
        boolean isOwner = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("OWNER"));

        // Privacy Restriction: Only once for owners
        if (isOwner && proof.isViewedByOwner()) {
            throw new RuntimeException("Privacy Violation: You have already viewed this original asset once mapping verification.");
        }

        String targetPath = "front".equalsIgnoreCase(side) ? proof.getFrontFilePath() : proof.getBackFilePath();
        if (targetPath == null) throw new RuntimeException("Requested document side is missing.");

        try {
            Path filePath = Paths.get(".").resolve(targetPath).normalize();
            URI uri = filePath.toUri();
            Resource resource = new UrlResource(uri);

            if (resource.exists() || resource.isReadable()) {
                if (isOwner) documentService.markIdentityAsViewed(proofId, userDetails.getId());

                String contentType = targetPath.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + side + "_" + proof.getType() + "\"")
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read identity proof file: " + targetPath);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to download identity proof: " + e.getMessage());
        }
    }

}
