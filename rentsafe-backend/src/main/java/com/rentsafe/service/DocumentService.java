package com.rentsafe.service;

import com.rentsafe.entity.IdentityProof;
import com.rentsafe.entity.Property;
import com.rentsafe.entity.TenantDocument;
import com.rentsafe.entity.Unit;
import com.rentsafe.entity.User;
import com.rentsafe.repository.IdentityProofRepository;
import com.rentsafe.repository.TenantDocumentRepository;
import com.rentsafe.repository.UserRepository;
import com.rentsafe.entity.Activity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;

@Service
public class DocumentService {

    @Transactional(readOnly = true)
    public java.util.List<TenantDocument> getPendingDocuments() {
        return tenantDocumentRepository.findByStatus(TenantDocument.DocumentStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public java.util.List<IdentityProof> getPendingIdentityProofs() {
        return identityProofRepository.findByStatus(IdentityProof.ProofStatus.PENDING);
    }

    @Autowired
    private IdentityProofRepository identityProofRepository;

    @Autowired
    private TenantDocumentRepository tenantDocumentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityService activityService;

    @Value("${rentsafe.upload.directory:./uploads}")
    private String uploadDir;

    private String saveFileToDisk(MultipartFile file, String relativePath) throws IOException {
        Path targetPath = Paths.get(uploadDir).resolve(relativePath).normalize();
        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        return relativePath;
    }

    public IdentityProof uploadIdentityProof(User user, IdentityProof.ProofType type, String number, 
            String fullName, LocalDate dob, String address, 
            MultipartFile frontFile, MultipartFile backFile) throws IOException {
        
        String frontHash = calculateHash(frontFile);
        String frontRelativePath = "id/" + user.getId() + "_front_" + frontFile.getOriginalFilename();
        saveFileToDisk(frontFile, frontRelativePath);

        String backRelativePath = null;
        if (backFile != null && !backFile.isEmpty()) {
            backRelativePath = "id/" + user.getId() + "_back_" + backFile.getOriginalFilename();
            saveFileToDisk(backFile, backRelativePath);
        }

        IdentityProof proof = IdentityProof.builder()
                .user(user)
                .type(type)
                .number(number)
                .fullName(fullName)
                .dateOfBirth(dob)
                .permanentAddress(address)
                .uploadDate(LocalDate.now())
                .status(IdentityProof.ProofStatus.PENDING)
                .fileHash(frontHash)
                .documentUrl("api/documents/identity/file/front/" + user.getId()) // Abstracted URL
                .backDocumentUrl(backRelativePath != null ? "api/documents/identity/file/back/" + user.getId() : null)
                .viewedByOwner(false)
                .build();
        
        // Internal storage path kept private in entity if needed, but for now we follow current pattern
        // but we will use the clean URL approach in the response.
        proof.setDocumentUrl("uploads/" + frontRelativePath);
        if (backRelativePath != null) proof.setBackDocumentUrl("uploads/" + backRelativePath);

        return identityProofRepository.save(proof);
    }

    public void markIdentityAsViewed(@NonNull String proofId, @NonNull String ownerId) {
        IdentityProof proof = identityProofRepository.findById(proofId)
                .orElseThrow(() -> new RuntimeException("Identity proof not found"));
        
        if (!proof.isViewedByOwner()) {
            proof.setViewedByOwner(true);
            identityProofRepository.save(proof);
            
            // Audit Log for Owner (Access record)
            activityService.logActivity(
                ownerId,
                Activity.ActivityType.SYSTEM,
                "Sensitive Asset Access",
                "You have used your one-time verification access for " + proof.getUser().getName() + "'s " + proof.getType() + ".",
                "IDENTITY_PROOF",
                proofId
            );

            // Audit Log for Tenant (Privacy Alert)
            activityService.logActivity(
                proof.getUser().getId(),
                Activity.ActivityType.VERIFICATION,
                "Privacy Alert: Document Accessed",
                "Your " + proof.getType() + " has been viewed by the property owner as part of the verification protocol.",
                "IDENTITY_PROOF",
                proofId
            );
        }
    }

    public java.util.List<TenantDocument> getDocumentsByUser(User user) {
        List<TenantDocument> docs = tenantDocumentRepository.findByUserId(user.getId());
        docs.forEach(this::populateTenantDocumentUrls);
        return docs;
    }

    public java.util.List<IdentityProof> getIdentityProofsByUser(User user) {
        List<IdentityProof> proofs = identityProofRepository.findByUserId(user.getId());
        proofs.forEach(this::populateIdentityProofUrls);
        return proofs;
    }

    public TenantDocument updateDocumentStatus(String docId, TenantDocument.DocumentStatus status) {
        if (docId == null) throw new IllegalArgumentException("Document ID is required");
        TenantDocument doc = tenantDocumentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setStatus(status);
        return tenantDocumentRepository.save(doc);
    }

    public IdentityProof updateIdentityStatus(@NonNull String proofId, @NonNull IdentityProof.ProofStatus status, String ownerId) {
        IdentityProof proof = identityProofRepository.findById(proofId)
                .orElseThrow(() -> new RuntimeException("Identity proof not found"));
        proof.setStatus(status);
        IdentityProof saved = identityProofRepository.save(proof);

        // Notify user via Activity Log
        activityService.logActivity(
            proof.getUser().getId(),
            Activity.ActivityType.VERIFICATION,
            "Identity Protocol Update",
            "Your " + proof.getType() + " has been " + status.name() + " by the property owner.",
            "IDENTITY_PROOF",
            proofId
        );

        return saved;
    }

    public TenantDocument uploadTenantDocument(User user, TenantDocument.DocumentType type, String name,
            MultipartFile file) throws IOException {
        String hash = calculateHash(file);
        String relativePath = "docs/" + user.getId() + "_" + file.getOriginalFilename();
        saveFileToDisk(file, relativePath);

        TenantDocument doc = TenantDocument.builder()
                .user(user)
                .type(type)
                .name(name)
                .uploadDate(LocalDate.now())
                .status(TenantDocument.DocumentStatus.PENDING)
                .fileHash(hash)
                .filePath("uploads/" + relativePath)
                .build();
        
        doc.setDisplayUrl("api/documents/" + doc.getId() + "/download");

        return tenantDocumentRepository.save(doc);
    }

    /** Upload an agreement or identity doc scoped to a specific unit */
    public TenantDocument uploadDocumentForUnit(User user, Unit unit,
            TenantDocument.DocumentType type, String name, MultipartFile file) throws IOException {
        String hash = calculateHash(file);
        String originalFilename = file.getOriginalFilename();
        String safeFilename = (originalFilename != null && !originalFilename.isEmpty())
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "file_" + System.currentTimeMillis();
        
        String relativePath = "units/" + unit.getId() + "/" + user.getId() + "_" + safeFilename;
        saveFileToDisk(file, relativePath);

        TenantDocument doc = TenantDocument.builder()
                .user(user)
                .unit(unit)
                .type(type)
                .name(name)
                .uploadDate(LocalDate.now())
                .status(TenantDocument.DocumentStatus.PENDING)
                .fileHash(hash)
                .filePath("uploads/" + relativePath)
                .build();
        
        doc.setDisplayUrl("api/documents/" + doc.getId() + "/download");

        return tenantDocumentRepository.save(doc);
    }

    /** Get all documents scoped to a unit */
    @Transactional(readOnly = true)
    public java.util.List<TenantDocument> getDocumentsByUnit(String unitId) {
        return tenantDocumentRepository.findByUnitId(unitId);
    }

    /** Upload an agreement or deed/insurance scoped to a specific property */
    public TenantDocument uploadDocumentForProperty(User user, Property property,
            TenantDocument.DocumentType type, String name, MultipartFile file) throws IOException {
        String hash = calculateHash(file);
        String safeFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "file";

        String relativePath = "properties/" + property.getId() + "/" + user.getId() + "_" + safeFilename;
        saveFileToDisk(file, relativePath);

        TenantDocument doc = TenantDocument.builder()
                .user(user)
                .property(property)
                .type(type)
                .name(name)
                .uploadDate(LocalDate.now())
                .status(TenantDocument.DocumentStatus.PENDING)
                .fileHash(hash)
                .filePath("uploads/" + relativePath)
                .build();
        
        doc.setDisplayUrl("api/documents/" + doc.getId() + "/download");

        return tenantDocumentRepository.save(doc);
    }

    /** Get all documents scoped to a property */
    @Transactional(readOnly = true)
    public java.util.List<TenantDocument> getDocumentsByProperty(String propertyId) {
        return tenantDocumentRepository.findByPropertyId(propertyId);
    }

    /** Get a single document by ID for download */
    @Transactional(readOnly = true)
    public TenantDocument getDocumentById(String docId) {
        if (docId == null) throw new IllegalArgumentException("Document ID is required");
        return tenantDocumentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + docId));
    }

    /** Get a single identity proof by ID for download */
    @Transactional(readOnly = true)
    public IdentityProof getIdentityProofById(String proofId) {
        if (proofId == null) throw new IllegalArgumentException("Proof ID is required");
        return identityProofRepository.findById(proofId)
                .orElseThrow(() -> new RuntimeException("Identity proof not found: " + proofId));
    }

    @Transactional(readOnly = true)
    public java.util.List<TenantDocument> getDocumentsByUserIds(java.util.List<String> userIds) {
        List<TenantDocument> docs = tenantDocumentRepository.findByUserIdIn(userIds);
        docs.forEach(this::populateTenantDocumentUrls);
        return docs;
    }

    @Transactional(readOnly = true)
    public java.util.List<IdentityProof> getIdentityProofsByUserIds(java.util.List<String> userIds) {
        List<IdentityProof> proofs = identityProofRepository.findByUserIdIn(userIds);
        proofs.forEach(this::populateIdentityProofUrls);
        return proofs;
    }

    private void populateTenantDocumentUrls(TenantDocument doc) {
        if (doc != null) {
            doc.setDisplayUrl("api/documents/" + doc.getId() + "/download");
        }
    }

    private void populateIdentityProofUrls(IdentityProof proof) {
        if (proof != null) {
            proof.setDocumentUrl("api/documents/identity/" + proof.getId() + "/download/front");
            if (proof.getBackFilePath() != null) {
                proof.setBackDocumentUrl("api/documents/identity/" + proof.getId() + "/download/back");
            }
        }
    }

    @Transactional
    public void deleteDocument(String docId, String currentUserId) {
        if (docId == null) throw new IllegalArgumentException("Document ID is required");
        if (currentUserId == null) throw new IllegalArgumentException("Current User ID is required");
        TenantDocument doc = tenantDocumentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + docId));
        
        // Ownership Check: Owners can delete anything, Tenants only their own
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean isOwner = currentUser.getUserType() != null && currentUser.getUserType().name().equals("OWNER");
        boolean isCreator = doc.getUser() != null && doc.getUser().getId().equals(currentUserId);
        
        if (!isOwner && !isCreator) {
            throw new RuntimeException("Unauthorized: You do not have permission to delete this document");
        }
        
        // Remove file from disk
        if (doc.getFilePath() != null) {
            deleteFileFromDisk(doc.getFilePath());
        }
        
        tenantDocumentRepository.delete(doc);
    }

    @Transactional
    public void deleteIdentityProof(String proofId, String currentUserId) {
        if (proofId == null) throw new IllegalArgumentException("Proof ID is required");
        if (currentUserId == null) throw new IllegalArgumentException("Current User ID is required");
        IdentityProof proof = identityProofRepository.findById(proofId)
                .orElseThrow(() -> new RuntimeException("Identity proof not found: " + proofId));
        
        // Ownership Check: Owners can delete anything, Tenants only their own
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean isOwner = currentUser.getUserType() != null && currentUser.getUserType().name().equals("OWNER");
        boolean isCreator = proof.getUser() != null && proof.getUser().getId().equals(currentUserId);
        
        if (!isOwner && !isCreator) {
            throw new RuntimeException("Unauthorized: You do not have permission to delete this identity proof");
        }
        
        // Remove file from disk
        if (proof.getFrontFilePath() != null) {
            deleteFileFromDisk(proof.getFrontFilePath());
        }
        if (proof.getBackFilePath() != null) {
            deleteFileFromDisk(proof.getBackFilePath());
        }
        
        identityProofRepository.delete(proof);
    }

    private void deleteFileFromDisk(String storedUrl) {
        try {
            // Strip "uploads/" prefix to find relative path from uploadDir
            String relativeToUploads = storedUrl.replaceFirst("^uploads/", "");
            Path filePath = Paths.get(uploadDir).resolve(relativeToUploads).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log error but don't fail the DB transaction if file is missing
            System.err.println("Could not delete file: " + storedUrl + " - " + e.getMessage());
        }
    }

    private String calculateHash(MultipartFile file) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

}
