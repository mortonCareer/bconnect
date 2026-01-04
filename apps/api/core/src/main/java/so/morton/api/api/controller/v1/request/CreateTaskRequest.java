package so.morton.api.api.controller.v1.request;

import so.morton.api.storage.entity.Address;
import so.morton.api.storage.value.Trade;

import java.time.LocalDate;
import java.util.Set;

public record CreateTaskRequest(
        String company,
        Address address,
        String taskTitle,
        String eventTitle,
        Set<Trade> trades,
        LocalDate start,
        LocalDate end
) {}
