
export type VehicleType = 'All' | 'Auto' | 'Car' | 'Pickup' | 'Lorry'

export type Driver = {
  id: number
  name: string
  vehicle: Exclude<VehicleType, 'All'>
  area: string
  fare: number
  rating: number
  available: boolean
  trips: number
}

export const mockDrivers: Driver[] = [
  {
    id: 1,
    name: 'Arun Kumar',
    vehicle: 'Auto',
    area: 'Rasipuram',
    fare: 150,
    rating: 4.8,
    available: true,
    trips: 124,
  },
  {
    id: 2,
    name: 'Prakash R',
    vehicle: 'Car',
    area: 'Rasipuram',
    fare: 450,
    rating: 4.9,
    available: true,
    trips: 210,
  },
  {
    id: 3,
    name: 'Suresh M',
    vehicle: 'Pickup',
    area: 'Namakkal',
    fare: 800,
    rating: 4.7,
    available: true,
    trips: 86,
  },
  {
    id: 4,
    name: 'Mani Selvam',
    vehicle: 'Lorry',
    area: 'Salem',
    fare: 1800,
    rating: 4.6,
    available: false,
    trips: 156,
  },
  {
    id: 5,
    name: 'Karthik S',
    vehicle: 'Auto',
    area: 'Namakkal',
    fare: 180,
    rating: 4.7,
    available: true,
    trips: 98,
  },
  {
    id: 6,
    name: 'Vijay Anand',
    vehicle: 'Car',
    area: 'Salem',
    fare: 500,
    rating: 4.9,
    available: true,
    trips: 187,
  },
]
