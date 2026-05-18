package com.rentsafe.service;

import com.rentsafe.entity.Bill;
import com.rentsafe.entity.Bill.BillStatus;
import com.rentsafe.entity.Notification;
import com.rentsafe.entity.Unit;
import com.rentsafe.repository.BillRepository;
import com.rentsafe.repository.UnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BillingService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Bill> getBillsForUnit(String unitId) {
        return billRepository.findByUnitId(unitId);
    }

    public Bill generateBill(String unitId, Bill bill) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        bill.setUnit(unit);
        bill.setStatus(BillStatus.PENDING);

        Bill saved = billRepository.save(bill);
        if (unit.getTenant() != null) {
            Notification.Urgency urgency = saved.getDueDate() != null && LocalDate.now().isAfter(saved.getDueDate())
                    ? Notification.Urgency.HIGH
                    : Notification.Urgency.MED;
            notificationService.createNotification(
                    unit.getTenant().getId(),
                    Notification.NotificationType.RENT,
                    "Bill due: " + saved.getType(),
                    String.format("%s bill of ₹%s due %s (%s).",
                            saved.getType(), saved.getAmount(), saved.getDueDate(), saved.getBillingPeriod()),
                    urgency);
        }
        return saved;
    }

    @Transactional
    public Bill payBill(String billId, String paymentRef) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        bill.setStatus(BillStatus.PAID);
        bill.setPaidDate(LocalDate.now());
        bill.setPaymentReference(paymentRef);

        Bill saved = billRepository.save(bill);
        Unit unit = saved.getUnit();
        if (unit != null && unit.getTenant() != null) {
            notificationService.createNotification(
                    unit.getTenant().getId(),
                    Notification.NotificationType.SYSTEM,
                    "Payment recorded",
                    String.format("Your %s bill was marked paid. Reference: %s.", saved.getType(), paymentRef),
                    Notification.Urgency.LOW);
        }
        return saved;
    }
}
