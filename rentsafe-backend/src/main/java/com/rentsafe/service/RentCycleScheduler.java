package com.rentsafe.service;

import com.rentsafe.entity.Bill;
import com.rentsafe.entity.Bill.BillStatus;
import com.rentsafe.entity.Unit;
import com.rentsafe.repository.BillRepository;
import com.rentsafe.repository.UnitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * RentCycleScheduler — automatically generates monthly rent bills per unit
 * based on the unit's occupancy anniversary date.
 *
 * Runs daily at 00:05 AM. For each occupied RENTAL unit, it checks:
 *   - What day of month did the tenant move in? (rentDueDate → lastFilledDate → day 1)
 *   - If today matches that day, generate a new PENDING RENT bill for this month.
 *   - Reset unit.rentStatus to PENDING so the AR dashboard reflects the new due.
 *
 * Example: Tenant moved in on 15th → rent bill is generated every 15th of the month.
 */
@Service
public class RentCycleScheduler {

    private static final Logger log = LoggerFactory.getLogger(RentCycleScheduler.class);

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private BillRepository billRepository;

    /**
     * Runs daily at 00:05 AM.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void rolloverMonthlyRentCycle() {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        log.info("[RentCycle] Daily check running for {} ...", today);

        List<Unit> occupiedUnits = unitRepository.findByStatus(Unit.UnitStatus.OCCUPIED);
        int newBillsCreated = 0;
        int unitsReset = 0;

        for (Unit unit : occupiedUnits) {
            // Only RENTAL units with a tenant and a positive rent amount
            if (unit.getAgreementType() != Unit.AgreementType.RENTAL) continue;
            if (unit.getTenant() == null) continue;
            if (unit.getRent() == null || unit.getRent().compareTo(BigDecimal.ZERO) <= 0) continue;

            // Determine the bill-due day for this unit:
            // Priority: rentDueDate day-of-month → lastFilledDate day-of-month → 1st
            int dueDayOfMonth = getOccupancyDayOfMonth(unit);

            // Clamp to valid range for the current month (e.g., 31 → 28 in February)
            int clampedDay = Math.min(dueDayOfMonth, currentMonth.lengthOfMonth());

            // Only act on units whose due day matches today
            if (today.getDayOfMonth() != clampedDay) continue;

            // Idempotency guard — skip if a RENT bill already exists for this month
            List<Bill> existingBills = billRepository.findByUnitId(unit.getId());
            Set<YearMonth> existingRentMonths = existingBills.stream()
                    .filter(b -> b.getType() == Bill.BillType.RENT && b.getDueDate() != null)
                    .map(b -> YearMonth.from(b.getDueDate()))
                    .collect(Collectors.toSet());

            if (!existingRentMonths.contains(currentMonth)) {
                String billingPeriod = currentMonth.getMonth()
                        .getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + currentMonth.getYear();
                LocalDate dueDate = LocalDate.of(today.getYear(), today.getMonth(), clampedDay);

                Bill newRentBill = Bill.builder()
                        .type(Bill.BillType.RENT)
                        .amount(unit.getRent())
                        .dueDate(dueDate)
                        .status(BillStatus.PENDING)
                        .billingPeriod(billingPeriod)
                        .paidDate(null)
                        .unit(unit)
                        .build();

                billRepository.save(newRentBill);
                newBillsCreated++;
                log.info("[RentCycle] Created PENDING rent bill for unit {} | due {} | period {}",
                        unit.getName(), dueDate, billingPeriod);
            }

            // Reset unit rent status to PENDING for the new cycle
            if (unit.getRentStatus() == Unit.RentStatus.PAID) {
                unit.setRentStatus(Unit.RentStatus.PENDING);
                unitRepository.save(unit);
                unitsReset++;
                log.info("[RentCycle] Reset rentStatus to PENDING for unit {}", unit.getName());
            }
        }

        log.info("[RentCycle] Done — {} new RENT bills created, {} units reset to PENDING.", newBillsCreated, unitsReset);
    }

    /**
     * Resolves the occupancy anniversary day-of-month for a unit.
     * Priority: explicit rentDueDate → lastFilledDate → day 1 (fallback).
     */
    private int getOccupancyDayOfMonth(Unit unit) {
        if (unit.getRentDueDate() != null) {
            return unit.getRentDueDate().getDayOfMonth();
        }
        if (unit.getLastFilledDate() != null) {
            return unit.getLastFilledDate().getDayOfMonth();
        }
        return 1; // safe default
    }
}
