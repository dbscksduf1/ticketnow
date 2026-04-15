package com.ticketing.reservation.kafka;

import com.ticketing.reservation.entity.Reservation;

public interface ReservationEventProducer {
    void sendReservationCompleted(Reservation reservation);
    void sendReservationCancelled(Reservation reservation);
}
