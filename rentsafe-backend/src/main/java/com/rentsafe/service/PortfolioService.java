package com.rentsafe.service;

import com.rentsafe.entity.MaintenanceTicket;
import com.rentsafe.entity.Property;
import com.rentsafe.entity.Unit;
import com.rentsafe.payload.response.PortfolioPropertySummary;
import com.rentsafe.payload.response.PortfolioSummary;
import com.rentsafe.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PortfolioService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Transactional(readOnly = true)
    public PortfolioSummary getOwnerPortfolioSummary(String ownerId, int renewalWindowDays) {
        List<Property> properties = propertyRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);

        int totalUnits = 0;
        int occupiedUnits = 0;
        int vacantUnits = 0;
        int pendingRentCount = 0;
        int openTicketsCount = 0;
        int renewalsDueSoonCount = 0;

        LocalDate cutoff = LocalDate.now().plusDays(Math.max(renewalWindowDays, 0));
        List<PortfolioPropertySummary> cards = new ArrayList<>();

        for (Property p : properties) {
            int pTotal = 0;
            int pOccupied = 0;
            int pVacant = 0;
            int pPendingRent = 0;
            int pOpenTickets = 0;
            int pRenewalsDueSoon = 0;

            if (p.getUnits() != null) {
                for (Unit u : p.getUnits()) {
                    pTotal++;

                    if (u.getStatus() == Unit.UnitStatus.OCCUPIED) pOccupied++;
                    if (u.getStatus() == Unit.UnitStatus.VACANT) pVacant++;

                    if (u.getRentStatus() == Unit.RentStatus.PENDING) pPendingRent++;

                    if (u.getLeaseEndDate() != null && !u.getLeaseEndDate().isAfter(cutoff)) {
                        pRenewalsDueSoon++;
                    }

                    if (u.getMaintenanceTickets() != null) {
                        for (MaintenanceTicket t : u.getMaintenanceTickets()) {
                            if (t.getStatus() != MaintenanceTicket.TicketStatus.RESOLVED) {
                                pOpenTickets++;
                            }
                        }
                    }
                }
            }

            totalUnits += pTotal;
            occupiedUnits += pOccupied;
            vacantUnits += pVacant;
            pendingRentCount += pPendingRent;
            openTicketsCount += pOpenTickets;
            renewalsDueSoonCount += pRenewalsDueSoon;

            cards.add(PortfolioPropertySummary.builder()
                    .propertyId(p.getId())
                    .name(p.getName())
                    .address(p.getAddress())
                    .totalUnits(pTotal)
                    .occupiedUnits(pOccupied)
                    .vacantUnits(pVacant)
                    .pendingRentCount(pPendingRent)
                    .openTicketsCount(pOpenTickets)
                    .renewalsDueSoonCount(pRenewalsDueSoon)
                    .build());
        }

        return PortfolioSummary.builder()
                .propertiesCount(properties.size())
                .totalUnits(totalUnits)
                .occupiedUnits(occupiedUnits)
                .vacantUnits(vacantUnits)
                .pendingRentCount(pendingRentCount)
                .openTicketsCount(openTicketsCount)
                .renewalsDueSoonCount(renewalsDueSoonCount)
                .properties(cards)
                .build();
    }
}

