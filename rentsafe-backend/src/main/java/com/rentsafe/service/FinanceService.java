package com.rentsafe.service;

import com.rentsafe.entity.Bill;
import com.rentsafe.entity.Bill.BillStatus;
import com.rentsafe.entity.Property;
import com.rentsafe.entity.Unit;
import com.rentsafe.payload.response.AnalyticsTrends;
import com.rentsafe.payload.response.FinanceMetrics;
import com.rentsafe.payload.response.LeaseSummary;
import com.rentsafe.payload.response.RevenueInsight;
import com.rentsafe.payload.response.UnitRevenueDTO;
import com.rentsafe.repository.PropertyRepository;
import com.rentsafe.repository.UnitRepository;
import com.rentsafe.repository.BillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.Locale;
import java.util.Optional;

import com.rentsafe.payload.response.RenewalRowDTO;

@Service
public class FinanceService {

    @Autowired
    private PropertyRepository propertyRepository;
    
    @Autowired
    private UnitRepository unitRepository;
    
    @Autowired
    private BillRepository billRepository;
    
    @Autowired
    private NotificationService notificationService;

    @Transactional(readOnly = true)
    public FinanceMetrics getFinanceMetrics(String ownerId) {
        RevenueInsight insight = getOwnerInsights(ownerId);
        return FinanceMetrics.builder()
                .monthlyGross(insight.getMonthlyGross())
                .monthlyNet(insight.getMonthlyNet())
                .potentialRevenue(insight.getPotentialRevenue())
                .pendingRent(insight.getPendingRent())
                .totalExpenses(insight.getTotalExpenses())
                .maintenanceReserve(insight.getMaintenanceReserve())
                .collectedBillsAllTime(insight.getCollectedBillsAllTime())
                .collectedBillsThisMonth(insight.getCollectedBillsThisMonth())
                .rentMarkedPaidPortfolioTotal(insight.getRentMarkedPaidPortfolioTotal())
                .totalCollectedRecognized(insight.getTotalCollectedRecognized())
                .expectedMonthlyRent(insight.getMonthlyGross())
                .successfullyCollected(insight.getTotalCollectedRecognized())
                .unpaidRent(insight.getPendingRent())
                .outstandingUtilityBills(insight.getTotalExpenses())
                .build();
    }

    @Transactional(readOnly = true)
    public List<RenewalRowDTO> getRenewalsForOwner(String ownerId, int windowDays) {
        List<Property> properties = propertyRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(windowDays);
        List<RenewalRowDTO> rows = new ArrayList<>();

        for (Property property : properties) {
            for (Unit unit : property.getUnits()) {
                if (unit.getLeaseEndDate() != null && unit.getTenant() != null) {
                    LocalDate d = unit.getLeaseEndDate();
                    if (!d.isBefore(today) && !d.isAfter(end)) {
                        rows.add(RenewalRowDTO.builder()
                                .unitId(unit.getId())
                                .unitName(unit.getName())
                                .propertyName(property.getName())
                                .kind("LEASE_END")
                                .dueDate(d)
                                .build());
                    }
                }
                if (unit.getRentDueDate() != null && unit.getTenant() != null
                        && unit.getAgreementType() == Unit.AgreementType.RENTAL) {
                    LocalDate d = unit.getRentDueDate();
                    if (!d.isBefore(today) && !d.isAfter(end)) {
                        rows.add(RenewalRowDTO.builder()
                                .unitId(unit.getId())
                                .unitName(unit.getName())
                                .propertyName(property.getName())
                                .kind("RENT_DUE")
                                .dueDate(d)
                                .build());
                    }
                }
            }
        }
        rows.sort(Comparator.comparing(RenewalRowDTO::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return rows;
    }

    @Transactional(readOnly = true)
    public List<UnitRevenueDTO> getUnitRevenues(String ownerId) {
        return getOwnerInsights(ownerId).getUnitRevenues();
    }

    @Transactional(readOnly = true)
    public AnalyticsTrends getAnalyticsTrends(String ownerId) {
        RevenueInsight insight = getOwnerInsights(ownerId);
        return AnalyticsTrends.builder()
                .monthlyTrends(insight.getMonthlyTrends())
                .historicalRevenue(insight.getHistoricalRevenue())
                .build();
    }

    @Transactional(readOnly = true)
    public LeaseSummary getLeaseSummary(String ownerId) {
        RevenueInsight insight = getOwnerInsights(ownerId);
        return LeaseSummary.builder()
                .totalLeaseDeposits(insight.getTotalLeaseDeposits())
                .activeLeaseCount(insight.getActiveLeaseCount())
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getExpenseBreakdown(String ownerId) {
        return getOwnerInsights(ownerId).getExpenseBreakdown();
    }

    /** Monolithic aggregate for internal use or backward compatibility */
    @Transactional(readOnly = true)
    public RevenueInsight getOwnerInsights(String ownerId) {
        List<Property> properties = propertyRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);

        BigDecimal monthlyGross = BigDecimal.ZERO;
        BigDecimal potentialRevenue = BigDecimal.ZERO;
        BigDecimal pendingRent = BigDecimal.ZERO;
        BigDecimal totalLeaseDeposits = BigDecimal.ZERO;
        int activeLeaseCount = 0;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> expenseBreakdown = new HashMap<>();
        List<UnitRevenueDTO> unitRevenues = new ArrayList<>();

        BigDecimal collectedBillsAllTime = BigDecimal.ZERO;
        BigDecimal collectedBillsThisMonth = BigDecimal.ZERO;
        YearMonth currentMonth = YearMonth.now();
        BigDecimal rentMarkedPaidPortfolioTotal = BigDecimal.ZERO;

        for (Property property : properties) {
            BigDecimal propertyMaintenance = property.getMaintenanceAmount() != null ? property.getMaintenanceAmount() : BigDecimal.ZERO;

            for (Unit unit : property.getUnits()) {
                // Auto-Reconciliation: If tenant exists but status is VACANT, fix it permanently
                if (unit.getTenant() != null && unit.getStatus() == Unit.UnitStatus.VACANT) {
                    unit.setStatus(Unit.UnitStatus.OCCUPIED);
                    unitRepository.save(unit);
                }

                Unit.AgreementType type = unit.getAgreementType() != null ? unit.getAgreementType() : Unit.AgreementType.RENTAL;
                
                // Add Configured Rent to Expense Breakdown (Bill-Type Exposure)
                if (type == Unit.AgreementType.RENTAL && unit.getRent() != null && unit.getRent().compareTo(BigDecimal.ZERO) > 0) {
                    expenseBreakdown.put("RENT", expenseBreakdown.getOrDefault("RENT", BigDecimal.ZERO).add(unit.getRent()));
                }
                
                // Add Configured Maintenance to Expense Breakdown (per-unit basis)
                if (propertyMaintenance.compareTo(BigDecimal.ZERO) > 0) {
                    expenseBreakdown.put("MAINTENANCE", expenseBreakdown.getOrDefault("MAINTENANCE", BigDecimal.ZERO).add(propertyMaintenance));
                }

                boolean isOccupied = unit.getStatus() == Unit.UnitStatus.OCCUPIED || unit.getTenant() != null;
                if (isOccupied && type == Unit.AgreementType.RENTAL) {
                    ensureRentLedgerHistory(unit);
                }

                // Derive rent status from current month's RENT bill (source of truth)
                String derivedRentStatus;
                if (!isOccupied) {
                    derivedRentStatus = "VACANT";
                } else if (type == Unit.AgreementType.LEASE) {
                    derivedRentStatus = "LEASE";
                } else {
                    Optional<Bill> currentRentBill = unit.getBills().stream()
                            .filter(b -> b.getType() == Bill.BillType.RENT
                                    && b.getDueDate() != null
                                    && YearMonth.from(b.getDueDate()).equals(currentMonth))
                            .findFirst();
                    if (currentRentBill.isPresent()) {
                        derivedRentStatus = currentRentBill.get().getStatus().name();
                        // Sync unit.rentStatus field with the bill's status
                        Unit.RentStatus syncedStatus = currentRentBill.get().getStatus() == BillStatus.PAID
                                ? Unit.RentStatus.PAID : Unit.RentStatus.PENDING;
                        if (unit.getRentStatus() != syncedStatus) {
                            unit.setRentStatus(syncedStatus);
                            unitRepository.save(unit);
                        }
                    } else {
                        derivedRentStatus = unit.getRentStatus() != null ? unit.getRentStatus().name() : "PENDING";
                    }
                }

                UnitRevenueDTO unitDto = UnitRevenueDTO.builder()
                        .unitId(unit.getId())
                        .unitName(unit.getName())
                        .propertyName(property.getName())
                        .monthlyRent(type == Unit.AgreementType.RENTAL ? (unit.getRent() != null ? unit.getRent() : BigDecimal.ZERO) : BigDecimal.ZERO)
                        .agreementType(type.name())
                        .leaseAmount(unit.getLeaseAmount() != null ? unit.getLeaseAmount() : BigDecimal.ZERO)
                        .leaseTenure(unit.getLeaseTenure() != null ? unit.getLeaseTenure() : 0)
                        .rentStatus(derivedRentStatus)
                        .billStatuses(new HashMap<>())
                        .build();

                if (isOccupied) {
                    if (type == Unit.AgreementType.RENTAL) {
                        BigDecimal rent = unit.getRent() != null ? unit.getRent() : BigDecimal.ZERO;
                        monthlyGross = monthlyGross.add(rent);
                        if (!"PAID".equals(derivedRentStatus)) {
                            pendingRent = pendingRent.add(rent);
                        }
                    } else if (type == Unit.AgreementType.LEASE) {
                        BigDecimal leaseAmt = unit.getLeaseAmount() != null ? unit.getLeaseAmount() : BigDecimal.ZERO;
                        totalLeaseDeposits = totalLeaseDeposits.add(leaseAmt);
                        activeLeaseCount++;
                    }
                } else {
                    if (type == Unit.AgreementType.RENTAL) {
                        potentialRevenue = potentialRevenue.add(unit.getRent() != null ? unit.getRent() : BigDecimal.ZERO);
                    }
                }
                // Pillar analysis: Check latest status of each bill type
                for (Bill bill : unit.getBills()) {
                    if (bill.getType() != Bill.BillType.RENT) {
                        totalExpenses = totalExpenses.add(bill.getAmount());
                        // Only add to expenseBreakdown if it's not MAINTENANCE (since we used configured maintenance)
                        if (bill.getType() != Bill.BillType.MAINTENANCE) {
                            String billType = bill.getType().name();
                            expenseBreakdown.put(billType, expenseBreakdown.getOrDefault(billType, BigDecimal.ZERO).add(bill.getAmount()));
                        }
                    }
                    
                    // Track most critical utility pillars for the Collections view
                    unitDto.getBillStatuses().put(bill.getType().name(), bill.getStatus().name());

                    if (bill.getStatus() == Bill.BillStatus.PAID) {
                        if (bill.getType() != Bill.BillType.RENT) {
                            collectedBillsAllTime = collectedBillsAllTime.add(bill.getAmount());
                            if (bill.getPaidDate() != null && YearMonth.from(bill.getPaidDate()).equals(currentMonth)) {
                                collectedBillsThisMonth = collectedBillsThisMonth.add(bill.getAmount());
                            }
                        }
                    }
                }

                if (isOccupied && type == Unit.AgreementType.RENTAL && "PAID".equals(derivedRentStatus)) {
                    BigDecimal rent = unit.getRent() != null ? unit.getRent() : BigDecimal.ZERO;
                    rentMarkedPaidPortfolioTotal = rentMarkedPaidPortfolioTotal.add(rent);
                }
                
                unitRevenues.add(unitDto);
            }
        }

        LinkedHashMap<String, BigDecimal> historicalRevenue = buildOwnerPaidBillRevenueLastSixMonths(ownerId);
        List<BigDecimal> monthlyTrends = new ArrayList<>(historicalRevenue.values());

        BigDecimal netProfit = monthlyGross.subtract(totalExpenses);
        BigDecimal reserve = monthlyGross.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCollectedRecognized = collectedBillsAllTime.add(rentMarkedPaidPortfolioTotal)
                .setScale(2, RoundingMode.HALF_UP);

        return RevenueInsight.builder()
                .monthlyGross(monthlyGross)
                .monthlyNet(netProfit)
                .potentialRevenue(potentialRevenue)
                .pendingRent(pendingRent)
                .totalExpenses(totalExpenses)
                .maintenanceReserve(reserve)
                .collectedBillsAllTime(collectedBillsAllTime.setScale(2, RoundingMode.HALF_UP))
                .collectedBillsThisMonth(collectedBillsThisMonth.setScale(2, RoundingMode.HALF_UP))
                .rentMarkedPaidPortfolioTotal(rentMarkedPaidPortfolioTotal.setScale(2, RoundingMode.HALF_UP))
                .totalCollectedRecognized(totalCollectedRecognized)
                .totalLeaseDeposits(totalLeaseDeposits)
                .activeLeaseCount(activeLeaseCount)
                .expenseBreakdown(expenseBreakdown)
                .monthlyTrends(monthlyTrends)
                .unitRevenues(unitRevenues)
                .historicalRevenue(historicalRevenue)
                .build();
    }

    /**
     * Ensures that each of the last 6 months has exactly one RENT bill for the unit.
     * For past months: bills are created as PAID (historical assumption).
     * For the current month: bill is created as PENDING if not already present.
     * Due date is set to the unit's occupancy anniversary day (rentDueDate → lastFilledDate → 1st).
     * This method is idempotent — it will never create a duplicate for a month that already has a bill.
     */
    private void ensureRentLedgerHistory(Unit unit) {
        if (unit.getRent() == null || unit.getRent().compareTo(BigDecimal.ZERO) <= 0) return;

        YearMonth now = YearMonth.now();
        YearMonth start = now.minusMonths(5);

        // Determine occupancy anniversary day
        int dueDayOfMonth = 1;
        if (unit.getRentDueDate() != null) {
            dueDayOfMonth = unit.getRentDueDate().getDayOfMonth();
        } else if (unit.getLastFilledDate() != null) {
            dueDayOfMonth = unit.getLastFilledDate().getDayOfMonth();
        }

        // Build a set of YearMonths for which a RENT bill already exists
        Set<YearMonth> existingRentMonths = unit.getBills().stream()
                .filter(b -> b.getType() == Bill.BillType.RENT && b.getDueDate() != null)
                .map(b -> YearMonth.from(b.getDueDate()))
                .collect(java.util.stream.Collectors.toSet());

        for (YearMonth ym = start; !ym.isAfter(now); ym = ym.plusMonths(1)) {
            if (existingRentMonths.contains(ym)) continue; // already exists, skip

            // Past months default to PAID; current month starts as PENDING
            BillStatus status = ym.equals(now) ? BillStatus.PENDING : BillStatus.PAID;
            // Clamp day to valid range for the month (e.g., 31 → 28 in February)
            int clampedDay = Math.min(dueDayOfMonth, ym.lengthOfMonth());
            LocalDate dueDate = ym.atDay(clampedDay);
            LocalDate paidDate = (status == BillStatus.PAID) ? dueDate.plusDays(3) : null;

            Bill rentBill = Bill.builder()
                    .type(Bill.BillType.RENT)
                    .amount(unit.getRent())
                    .dueDate(dueDate)
                    .status(status)
                    .billingPeriod(ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + ym.getYear())
                    .paidDate(paidDate)
                    .unit(unit)
                    .build();
            unit.getBills().add(rentBill);
            billRepository.save(rentBill);
        }
    }

    /**
     * Last six calendar months of PAID bill amounts (by paidDate). No synthetic values.
     */
    private LinkedHashMap<String, BigDecimal> buildOwnerPaidBillRevenueLastSixMonths(String ownerId) {
        YearMonth now = YearMonth.now();
        YearMonth start = now.minusMonths(5);
        Map<YearMonth, BigDecimal> sums = new TreeMap<>();
        List<Bill> paidBills = billRepository.findPaidBillsWithPaidDateForOwner(ownerId, BillStatus.PAID);
        for (Bill b : paidBills) {
            if (b.getPaidDate() == null) {
                continue;
            }
            YearMonth ym = YearMonth.from(b.getPaidDate());
            if (!ym.isBefore(start) && !ym.isAfter(now)) {
                sums.merge(ym, b.getAmount(), BigDecimal::add);
            }
        }
        LinkedHashMap<String, BigDecimal> out = new LinkedHashMap<>();
        for (YearMonth ym = start; !ym.isAfter(now); ym = ym.plusMonths(1)) {
            String key = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + "-" + ym.getYear();
            BigDecimal v = sums.getOrDefault(ym, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            out.put(key, v);
        }
        return out;
    }

    @Transactional
    public void markBillPaid(String unitId, String billType) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));
                
        if ("RENT".equalsIgnoreCase(billType)) {
            unit.setRentStatus(Unit.RentStatus.PAID);
            unitRepository.save(unit);
            
            YearMonth now = YearMonth.now();
            List<Bill> unitBills = billRepository.findByUnitId(unitId);
            for (Bill bill : unitBills) {
                if (bill.getType() == Bill.BillType.RENT && bill.getStatus() == Bill.BillStatus.PENDING) {
                    if (bill.getDueDate() != null && YearMonth.from(bill.getDueDate()).equals(now)) {
                        bill.setStatus(Bill.BillStatus.PAID);
                        bill.setPaidDate(java.time.LocalDate.now());
                        billRepository.save(bill);
                        break;
                    }
                }
            }
            
            notificationService.sendPaymentReceiptEmailMock(unit, "Monthly Rent");
        } else {
            List<Bill> unitBills = billRepository.findByUnitId(unitId);
            for (Bill bill : unitBills) {
                if (bill.getType().name().equalsIgnoreCase(billType) && bill.getStatus() == Bill.BillStatus.PENDING) {
                    bill.setStatus(Bill.BillStatus.PAID);
                    bill.setPaidDate(java.time.LocalDate.now());
                    billRepository.save(bill);
                    notificationService.sendPaymentReceiptEmailMock(unit, billType);
                    break;
                }
            }
        }
    }
}
