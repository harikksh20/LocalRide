
import type { VehicleType } from '../../data/mockDrivers'

type VehicleOption = {
  label: VehicleType
  icon: string
  description: string
}

const vehicleOptions: VehicleOption[] = [
  { label: 'All', icon: '🚘', description: 'All vehicles' },
  { label: 'Auto', icon: '🛺', description: 'Quick local rides' },
  { label: 'Car', icon: '🚗', description: 'Comfortable rides' },
  { label: 'Pickup', icon: '🛻', description: 'Small goods' },
  { label: 'Lorry', icon: '🚚', description: 'Heavy transport' },
]

type VehicleCategoriesProps = {
  selectedVehicle: VehicleType
  onVehicleChange: (vehicle: VehicleType) => void
}

export default function VehicleCategories({
  selectedVehicle,
  onVehicleChange,
}: VehicleCategoriesProps) {
  return (
    <div className="vehicle-categories">
      {vehicleOptions.map((option) => (
        <button
          key={option.label}
          type="button"
          className={`category-card ${
            selectedVehicle === option.label ? 'category-active' : ''
          }`}
          onClick={() => onVehicleChange(option.label)}
          aria-pressed={selectedVehicle === option.label}
        >
          <span className="category-icon">{option.icon}</span>

          <span className="category-label">
            {option.label === 'All' ? 'All vehicles' : option.label}
          </span>

          <span className="category-description">
            {option.description}
          </span>
        </button>
      ))}
    </div>
  )
}
