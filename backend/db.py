
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4


# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
DATABASE_PATH = INSTANCE_DIR / "localride.db"


def get_connection():
    """Create and return a SQLite database connection."""
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


def current_timestamp():
    """Return the current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def row_to_dict(row):
    """Convert a SQLite row into a dictionary."""
    return dict(row) if row is not None else None


# --------------------------------------------------
# DATABASE INITIALIZATION AND MIGRATION
# --------------------------------------------------

def init_db():
    """Create tables and safely migrate existing databases."""

    with get_connection() as connection:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS drivers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                vehicle TEXT NOT NULL
                    CHECK (vehicle IN ('Auto', 'Car', 'Pickup', 'Lorry')),
                area TEXT NOT NULL,
                fare REAL NOT NULL CHECK (fare > 0),
                registered_at TEXT NOT NULL
            )
        """)

        driver_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(drivers)"
            ).fetchall()
        }

        if "password_hash" not in driver_columns:
            connection.execute("""
                ALTER TABLE drivers
                ADD COLUMN password_hash TEXT
            """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                reference TEXT NOT NULL UNIQUE,
                driver_id TEXT NOT NULL,
                driver_name TEXT NOT NULL,
                vehicle TEXT NOT NULL,
                area TEXT NOT NULL,
                fare REAL NOT NULL CHECK (fare > 0),
                pickup TEXT NOT NULL,
                destination TEXT NOT NULL,
                distance REAL NOT NULL CHECK (distance > 0),
                travel_date TEXT NOT NULL,
                phone TEXT NOT NULL,
                customer_name TEXT NOT NULL DEFAULT 'Customer',
                status TEXT NOT NULL DEFAULT 'Pending'
                    CHECK (
                        status IN (
                            'Pending',
                            'Confirmed',
                            'Completed',
                            'Cancelled'
                        )
                    ),
                created_at TEXT NOT NULL,
                FOREIGN KEY (driver_id)
                    REFERENCES drivers(id)
                    ON DELETE RESTRICT
            )
        """)

        # Safely migrate existing bookings.
        booking_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(bookings)"
            ).fetchall()
        }

        if "customer_name" not in booking_columns:
            connection.execute("""
                ALTER TABLE bookings
                ADD COLUMN customer_name TEXT NOT NULL DEFAULT 'Customer'
            """)

    print(f"Database initialized: {DATABASE_PATH}")


# --------------------------------------------------
# DRIVER FUNCTIONS
# --------------------------------------------------

def get_all_drivers():
    """Retrieve drivers without exposing password hashes."""

    with get_connection() as connection:
        rows = connection.execute("""
            SELECT
                id,
                name,
                phone,
                vehicle,
                area,
                fare,
                registered_at AS registeredAt
            FROM drivers
            ORDER BY registered_at DESC
        """).fetchall()

    return [row_to_dict(row) for row in rows]


def get_driver_by_id(driver_id):
    """Retrieve one driver without exposing the password hash."""

    with get_connection() as connection:
        row = connection.execute("""
            SELECT
                id,
                name,
                phone,
                vehicle,
                area,
                fare,
                registered_at AS registeredAt
            FROM drivers
            WHERE id = ?
        """, (driver_id,)).fetchone()

    return row_to_dict(row)


def get_driver_by_phone_for_auth(phone):
    """Retrieve authentication data for a phone number."""

    with get_connection() as connection:
        rows = connection.execute("""
            SELECT
                id,
                name,
                phone,
                vehicle,
                area,
                fare,
                registered_at AS registeredAt,
                password_hash
            FROM drivers
            WHERE phone = ?
        """, (phone,)).fetchall()

    if len(rows) != 1:
        return None

    return row_to_dict(rows[0])


def create_driver(
    name,
    phone,
    vehicle,
    area,
    fare,
    password_hash=None,
):
    """Register a driver with a hashed password."""

    driver_id = f"DRV-{uuid4().hex[:12].upper()}"
    registered_at = current_timestamp()

    with get_connection() as connection:
        connection.execute("""
            INSERT INTO drivers (
                id,
                name,
                phone,
                vehicle,
                area,
                fare,
                registered_at,
                password_hash
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            driver_id,
            name,
            phone,
            vehicle,
            area,
            fare,
            registered_at,
            password_hash,
        ))

    return {
        "id": driver_id,
        "name": name,
        "phone": phone,
        "vehicle": vehicle,
        "area": area,
        "fare": fare,
        "registeredAt": registered_at,
    }


def set_driver_password(driver_id, password_hash):
    """Set or replace a driver's hashed password."""

    with get_connection() as connection:
        cursor = connection.execute("""
            UPDATE drivers
            SET password_hash = ?
            WHERE id = ?
        """, (password_hash, driver_id))

    return cursor.rowcount > 0


# --------------------------------------------------
# BOOKING FUNCTIONS
# --------------------------------------------------

def create_booking(
    driver_id,
    pickup,
    destination,
    distance,
    travel_date,
    phone,
    customer_name="Customer",
):
    """Create a booking for a registered driver."""

    fare_rates = {
        "Auto": (30, 12),
        "Car": (80, 18),
        "Pickup": (100, 22),
        "Lorry": (200, 35),
    }

    with get_connection() as connection:

        driver_row = connection.execute("""
            SELECT id, name, phone, vehicle, area, fare
            FROM drivers
            WHERE id = ?
        """, (driver_id,)).fetchone()

        if driver_row is None:
            raise ValueError(
                "Driver not found. Only registered drivers can be booked."
            )

        driver = row_to_dict(driver_row)

        if driver["vehicle"] not in fare_rates:
            raise ValueError("Unsupported vehicle type.")

        base_fare, rate_per_km = fare_rates[driver["vehicle"]]
        fare = round(base_fare + float(distance) * rate_per_km, 2)

        booking_id = f"BK-{uuid4().hex[:12].upper()}"
        reference = f"LR-{uuid4().hex[:8].upper()}"
        created_at = current_timestamp()

        connection.execute("""
            INSERT INTO bookings (
                id,
                reference,
                driver_id,
                driver_name,
                vehicle,
                area,
                fare,
                pickup,
                destination,
                distance,
                travel_date,
                phone,
                customer_name,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking_id,
            reference,
            driver["id"],
            driver["name"],
            driver["vehicle"],
            driver["area"],
            fare,
            pickup,
            destination,
            distance,
            travel_date,
            phone,
            customer_name,
            "Pending",
            created_at,
        ))

    return {
        "id": booking_id,
        "reference": reference,
        "driverId": driver["id"],
        "driverName": driver["name"],
        "vehicle": driver["vehicle"],
        "area": driver["area"],
        "fare": fare,
        "pickup": pickup,
        "destination": destination,
        "distance": distance,
        "date": travel_date,
        "phone": phone,
        "customerName": customer_name,
        "status": "Pending",
        "createdAt": created_at,
    }


def get_all_bookings():
    """Retrieve all bookings, newest first."""

    with get_connection() as connection:
        rows = connection.execute("""
            SELECT
                id,
                reference,
                driver_id AS driverId,
                driver_name AS driverName,
                vehicle,
                area,
                fare,
                pickup,
                destination,
                distance,
                travel_date AS date,
                phone,
                customer_name AS customerName,
                status,
                created_at AS createdAt
            FROM bookings
            ORDER BY created_at DESC
        """).fetchall()

    return [row_to_dict(row) for row in rows]


def get_booking_by_id(booking_id):
    """Retrieve one booking by ID."""

    with get_connection() as connection:
        row = connection.execute("""
            SELECT
                id,
                reference,
                driver_id AS driverId,
                driver_name AS driverName,
                vehicle,
                area,
                fare,
                pickup,
                destination,
                distance,
                travel_date AS date,
                phone,
                customer_name AS customerName,
                status,
                created_at AS createdAt
            FROM bookings
            WHERE id = ?
        """, (booking_id,)).fetchone()

    return row_to_dict(row)


def cancel_booking(booking_id):
    """Cancel a booking only when its status is Pending."""

    with get_connection() as connection:

        row = connection.execute("""
            SELECT status
            FROM bookings
            WHERE id = ?
        """, (booking_id,)).fetchone()

        if row is None:
            return "not_found"

        if row["status"] != "Pending":
            return "not_pending"

        connection.execute("""
            UPDATE bookings
            SET status = 'Cancelled'
            WHERE id = ?
              AND status = 'Pending'
        """, (booking_id,))

    return "cancelled"


def update_booking_status(booking_id, new_status):
    """Move a booking through valid status transitions."""

    allowed_statuses = {"Confirmed", "Completed"}

    if new_status not in allowed_statuses:
        raise ValueError("Invalid booking status.")

    with get_connection() as connection:

        row = connection.execute("""
            SELECT status
            FROM bookings
            WHERE id = ?
        """, (booking_id,)).fetchone()

        if row is None:
            return "not_found"

        current_status = row["status"]

        if new_status == "Confirmed" and current_status != "Pending":
            return "invalid_transition"

        if new_status == "Completed" and current_status != "Confirmed":
            return "invalid_transition"

        connection.execute("""
            UPDATE bookings
            SET status = ?
            WHERE id = ?
        """, (new_status, booking_id))

    return "updated"


# --------------------------------------------------
# ALLOW DIRECT DATABASE INITIALIZATION
# --------------------------------------------------

if __name__ == "__main__":
    init_db()
