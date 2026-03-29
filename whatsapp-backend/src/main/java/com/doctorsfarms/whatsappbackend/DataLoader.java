package com.doctorsfarms.whatsappbackend;

import com.doctorsfarms.whatsappbackend.model.Room;
import com.doctorsfarms.whatsappbackend.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataLoader implements CommandLineRunner {

    private final RoomRepository roomRepository;

    public DataLoader(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (roomRepository.count() == 0) {
            // Sample rooms
            Room deluxeRoom = new Room();
            deluxeRoom.setName("Deluxe Room");
            deluxeRoom.setDescription("Spacious room with garden view");
            deluxeRoom.setCapacity(2);
            deluxeRoom.setPricePerNight(BigDecimal.valueOf(5000));
            deluxeRoom.setAvailable(true);

            Room suite = new Room();
            suite.setName("Executive Suite");
            suite.setDescription("Luxury suite with private balcony");
            suite.setCapacity(4);
            suite.setPricePerNight(BigDecimal.valueOf(8000));
            suite.setAvailable(true);

            roomRepository.save(deluxeRoom);
            roomRepository.save(suite);

            System.out.println("Sample rooms loaded!");
        }
    }
}