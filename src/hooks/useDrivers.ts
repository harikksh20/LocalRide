
import { useMemo } from "react";
import { mockDrivers, type VehicleType } from "../data/mockDrivers";

interface DriverFilters {
  area: string;
  vehicleType: VehicleType | "All";
}

export function useDrivers({ area, vehicleType }: DriverFilters) {
  return useMemo(() => {
    return mockDrivers.filter((driver) => {
      const matchesArea =
        area.trim() === "" ||
        driver.area.toLowerCase().includes(area.trim().toLowerCase());

      const matchesVehicle =
        vehicleType === "All" || driver.vehicle === vehicleType;

      return matchesArea && matchesVehicle && driver.available;
    });
  }, [area, vehicleType]);
}
