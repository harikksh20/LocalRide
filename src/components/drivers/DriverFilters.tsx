
type DriverFiltersProps = {
  availableOnly: boolean
  onAvailabilityChange: (availableOnly: boolean) => void
}

export default function DriverFilters({
  availableOnly,
  onAvailabilityChange,
}: DriverFiltersProps) {
  return (
    <label className="availability-toggle">
      <input
        type="checkbox"
        checked={availableOnly}
        onChange={(event) => onAvailabilityChange(event.target.checked)}
      />

      <span>Available only</span>
    </label>
  )
}
