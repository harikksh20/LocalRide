
import os
from datetime import date
from math import isfinite
from functools import wraps

from flask import Flask, jsonify, request, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

from db import (
    init_db,
    get_all_drivers,
    create_driver,
    create_booking,
    get_all_bookings,
    cancel_booking,
    update_booking_status,
    get_driver_by_phone_for_auth,
    get_booking_by_id,
)


# --------------------------------------------------
# APP CONFIGURATION
# --------------------------------------------------

app = Flask(__name__)

ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.environ.get(
        "LOCALRIDE_CORS_ORIGINS",
        "http://localhost:5173,https://local-ride-kappa.vercel.app",
    ).split(",")
    if origin.strip()
]

ALLOWED_VEHICLES = {"Auto", "Car", "Pickup", "Lorry"}
TOKEN_SALT = "localride-driver-auth"


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")

    if origin and origin.rstrip("/") in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PATCH, DELETE, OPTIONS"
        )

        requested_headers = request.headers.get(
            "Access-Control-Request-Headers"
        )

        response.headers["Access-Control-Allow-Headers"] = (
            requested_headers
            if requested_headers
            else "Content-Type, Authorization"
        )

        response.headers["Access-Control-Max-Age"] = "86400"
        response.headers["Vary"] = "Origin"

    return response


# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------

init_db()


# --------------------------------------------------
# AUTHENTICATION
# --------------------------------------------------

def get_token_serializer():
    secret_key = os.environ.get("LOCALRIDE_SECRET_KEY")

    if not secret_key:
        raise RuntimeError("LOCALRIDE_SECRET_KEY is not configured")

    return URLSafeTimedSerializer(
        secret_key,
        salt=TOKEN_SALT,
    )


def driver_required(view):
    """Require a valid driver login token."""

    @wraps(view)
    def wrapped(*args, **kwargs):
        authorization = request.headers.get("Authorization", "")
        parts = authorization.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "success": False,
                "message": "Driver login required",
            }), 401

        try:
            serializer = get_token_serializer()
            payload = serializer.loads(parts[1], max_age=86400)

            driver_id = payload.get("driver_id")

            if not isinstance(driver_id, str) or not driver_id:
                raise BadSignature("Invalid driver token")

            g.driver_id = driver_id

        except SignatureExpired:
            return jsonify({
                "success": False,
                "message": "Your login session has expired. Please log in again.",
            }), 401

        except (BadSignature, RuntimeError):
            return jsonify({
                "success": False,
                "message": "Invalid authentication token. Please log in again.",
            }), 401

        return view(*args, **kwargs)

    return wrapped


def public_driver(driver):
    """Remove private authentication information."""

    return {
        key: driver[key]
        for key in (
            "id",
            "name",
            "phone",
            "vehicle",
            "area",
            "fare",
            "registeredAt",
        )
        if key in driver
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health_check():
    return jsonify({
        "status": "ok",
        "message": "LocalRide API is running",
    }), 200


# --------------------------------------------------
# DRIVER ENDPOINTS
# --------------------------------------------------

@app.get("/api/drivers")
def list_drivers():
    try:
        drivers = get_all_drivers()

        return jsonify({
            "success": True,
            "count": len(drivers),
            "drivers": drivers,
        }), 200

    except Exception:
        app.logger.exception("Failed to retrieve drivers")

        return jsonify({
            "success": False,
            "message": "Could not retrieve drivers",
        }), 500


@app.post("/api/drivers")
def register_driver():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON",
        }), 400

    required = [
        "name",
        "phone",
        "vehicle",
        "area",
        "fare",
        "password",
    ]

    missing = [
        field for field in required
        if field not in data
        or data[field] is None
        or (
            isinstance(data[field], str)
            and not data[field].strip()
        )
    ]

    if missing:
        return jsonify({
            "success": False,
            "message": "Missing required fields",
            "fields": missing,
        }), 400

    name = data["name"].strip() if isinstance(data["name"], str) else ""
    phone = data["phone"].strip() if isinstance(data["phone"], str) else ""
    vehicle = data["vehicle"].strip() if isinstance(data["vehicle"], str) else ""
    area = data["area"].strip() if isinstance(data["area"], str) else ""
    password = data["password"]

    if not name or not phone or not vehicle or not area:
        return jsonify({
            "success": False,
            "message": "Name, phone, vehicle and area must be text values",
        }), 400

    if not isinstance(password, str) or len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 8 characters",
        }), 400

    if vehicle not in ALLOWED_VEHICLES:
        return jsonify({
            "success": False,
            "message": "Invalid vehicle type",
            "allowedVehicles": sorted(ALLOWED_VEHICLES),
        }), 400

    if not phone.isdigit() or not 7 <= len(phone) <= 15:
        return jsonify({
            "success": False,
            "message": "Phone must contain 7 to 15 digits",
        }), 400

    try:
        fare = float(data["fare"])

        if not isfinite(fare) or fare <= 0:
            raise ValueError

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Fare must be a finite number greater than zero",
        }), 400

    try:
        existing_driver = get_driver_by_phone_for_auth(phone)

        if existing_driver:
            return jsonify({
                "success": False,
                "message": "A driver with this phone number already exists",
            }), 409

        password_hash = generate_password_hash(password)

        driver = create_driver(
            name=name,
            phone=phone,
            vehicle=vehicle,
            area=area,
            fare=fare,
            password_hash=password_hash,
        )

        return jsonify({
            "success": True,
            "message": "Driver registered successfully",
            "driver": driver,
        }), 201

    except Exception:
        app.logger.exception("Failed to register driver")

        return jsonify({
            "success": False,
            "message": "Could not register driver",
        }), 500


# --------------------------------------------------
# DRIVER LOGIN
# --------------------------------------------------

@app.post("/api/auth/login")
def driver_login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON",
        }), 400

    phone = data.get("phone")
    password = data.get("password")

    if not isinstance(phone, str) or not isinstance(password, str):
        return jsonify({
            "success": False,
            "message": "Phone and password are required",
        }), 400

    phone = phone.strip()

    if not phone or not password:
        return jsonify({
            "success": False,
            "message": "Phone and password are required",
        }), 400

    try:
        driver = get_driver_by_phone_for_auth(phone)

        if (
            not driver
            or not driver.get("password_hash")
            or not check_password_hash(
                driver["password_hash"],
                password,
            )
        ):
            return jsonify({
                "success": False,
                "message": "Invalid phone number or password",
            }), 401

        token = get_token_serializer().dumps({
            "driver_id": driver["id"],
        })

        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "driver": public_driver(driver),
        }), 200

    except RuntimeError:
        app.logger.exception("Authentication secret is not configured")

        return jsonify({
            "success": False,
            "message": "Authentication is not configured on the server",
        }), 500

    except Exception:
        app.logger.exception("Driver login failed")

        return jsonify({
            "success": False,
            "message": "Could not log in",
        }), 500


# --------------------------------------------------
# CREATE BOOKING
# --------------------------------------------------

@app.post("/api/bookings")
def register_booking():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON",
        }), 400

    required = [
        "driverId",
        "pickup",
        "destination",
        "distance",
        "date",
        "phone",
        "customerName",
    ]

    missing = [
        key for key in required
        if key not in data
        or data[key] is None
        or (
            isinstance(data[key], str)
            and not data[key].strip()
        )
    ]

    if missing:
        return jsonify({
            "success": False,
            "message": "Missing required fields",
            "fields": missing,
        }), 400

    driver_id = data["driverId"]
    pickup = data["pickup"]
    destination = data["destination"]
    phone = data["phone"]
    travel_date = data["date"]
    customer_name = data["customerName"]

    if not all(
        isinstance(value, str)
        for value in (
            driver_id,
            pickup,
            destination,
            phone,
            travel_date,
            customer_name,
        )
    ):
        return jsonify({
            "success": False,
            "message": "Booking text fields must contain valid text",
        }), 400

    driver_id = driver_id.strip()
    pickup = pickup.strip()
    destination = destination.strip()
    phone = phone.strip()
    customer_name = customer_name.strip()
    travel_date = travel_date.strip()

    if len(customer_name) < 2 or len(customer_name) > 100:
        return jsonify({
            "success": False,
            "message": "Customer name must contain 2 to 100 characters",
        }), 400

    if not driver_id:
        return jsonify({
            "success": False,
            "message": "Invalid driver ID",
        }), 400

    if len(pickup) < 2 or len(destination) < 2:
        return jsonify({
            "success": False,
            "message": "Enter valid pickup and destination locations",
        }), 400

    if (
        not phone.isdigit()
        or len(phone) != 10
        or phone[0] not in "6789"
    ):
        return jsonify({
            "success": False,
            "message": "Enter a valid 10-digit Indian mobile number",
        }), 400

    try:
        distance = float(data["distance"])

        if not isfinite(distance) or not 0 < distance <= 10000:
            raise ValueError

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Distance must be greater than zero and at most 10000 km",
        }), 400

    try:
        date.fromisoformat(travel_date)

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Travel date must use YYYY-MM-DD format",
        }), 400

    try:
        booking = create_booking(
            driver_id=driver_id,
            pickup=pickup,
            destination=destination,
            distance=distance,
            travel_date=travel_date,
            phone=phone,
            customer_name=customer_name,
        )

        return jsonify({
            "success": True,
            "message": "Booking created successfully",
            "booking": booking,
        }), 201

    except ValueError as err:
        return jsonify({
            "success": False,
            "message": str(err),
        }), 404

    except Exception:
        app.logger.exception("Failed to create booking")

        return jsonify({
            "success": False,
            "message": "Could not create booking",
        }), 500


# --------------------------------------------------
# DRIVER BOOKING LIST
# --------------------------------------------------

@app.get("/api/bookings")
@driver_required
def list_bookings():
    try:
        bookings = get_all_bookings()

        driver_bookings = [
            booking for booking in bookings
            if booking.get("driverId") == g.driver_id
        ]

        return jsonify({
            "success": True,
            "count": len(driver_bookings),
            "bookings": driver_bookings,
        }), 200

    except Exception:
        app.logger.exception("Failed to retrieve driver bookings")

        return jsonify({
            "success": False,
            "message": "Could not retrieve bookings",
        }), 500


# --------------------------------------------------
# DRIVER CANCEL BOOKING
# --------------------------------------------------

@app.patch("/api/bookings/<booking_id>/cancel")
@driver_required
def cancel_booking_route(booking_id):
    try:
        booking = get_booking_by_id(booking_id)

        if not booking:
            return jsonify({
                "success": False,
                "message": "Booking not found",
            }), 404

        if booking.get("driverId") != g.driver_id:
            return jsonify({
                "success": False,
                "message": "You cannot modify another driver's booking",
            }), 403

        result = cancel_booking(booking_id)

        if result == "not_found":
            return jsonify({
                "success": False,
                "message": "Booking not found",
            }), 404

        if result == "not_pending":
            return jsonify({
                "success": False,
                "message": "Only pending bookings can be cancelled",
            }), 409

        return jsonify({
            "success": True,
            "message": "Booking cancelled successfully",
        }), 200

    except Exception:
        app.logger.exception("Failed to cancel booking")

        return jsonify({
            "success": False,
            "message": "Could not cancel booking",
        }), 500


# --------------------------------------------------
# DRIVER UPDATE BOOKING STATUS
# --------------------------------------------------

@app.patch("/api/bookings/<booking_id>/status")
@driver_required
def update_booking_status_route(booking_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON",
        }), 400

    status = data.get("status")

    if status not in {"Confirmed", "Completed"}:
        return jsonify({
            "success": False,
            "message": "Status must be Confirmed or Completed",
        }), 400

    try:
        booking = get_booking_by_id(booking_id)

        if not booking:
            return jsonify({
                "success": False,
                "message": "Booking not found",
            }), 404

        if booking.get("driverId") != g.driver_id:
            return jsonify({
                "success": False,
                "message": "You cannot modify another driver's booking",
            }), 403

        result = update_booking_status(booking_id, status)

        if result == "not_found":
            return jsonify({
                "success": False,
                "message": "Booking not found",
            }), 404

        if result == "invalid_transition":
            return jsonify({
                "success": False,
                "message": "This booking cannot transition to that status",
            }), 409

        return jsonify({
            "success": True,
            "message": f"Booking {status.lower()} successfully",
        }), 200

    except Exception:
        app.logger.exception("Failed to update booking status")

        return jsonify({
            "success": False,
            "message": "Could not update booking status",
        }), 500


# --------------------------------------------------
# CUSTOMER BOOKING HISTORY
# DEMO ONLY - NOT PRODUCTION AUTHENTICATION
# --------------------------------------------------

@app.get("/api/customer/bookings")
def list_customer_bookings():
    phone = request.args.get("phone", "").strip()

    if not phone.isdigit() or len(phone) != 10:
        return jsonify({
            "success": False,
            "message": "Enter a valid 10-digit phone number",
        }), 400

    try:
        bookings = get_all_bookings()

        customer_bookings = [
            booking for booking in bookings
            if booking.get("phone") == phone
        ]

        return jsonify({
            "success": True,
            "count": len(customer_bookings),
            "bookings": customer_bookings,
        }), 200

    except Exception:
        app.logger.exception("Failed to retrieve customer bookings")

        return jsonify({
            "success": False,
            "message": "Could not retrieve customer bookings",
        }), 500


@app.patch("/api/customer/bookings/<booking_id>/cancel")
def cancel_customer_booking(booking_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Phone number is required",
        }), 400

    phone = data.get("phone", "")

    if not isinstance(phone, str):
        return jsonify({
            "success": False,
            "message": "Invalid phone number",
        }), 400

    phone = phone.strip()

    if not phone.isdigit() or len(phone) != 10:
        return jsonify({
            "success": False,
            "message": "Enter a valid 10-digit phone number",
        }), 400

    try:
        booking = get_booking_by_id(booking_id)

        if not booking or booking.get("phone") != phone:
            return jsonify({
                "success": False,
                "message": "Booking not found for this phone number",
            }), 404

        result = cancel_booking(booking_id)

        if result == "not_found":
            return jsonify({
                "success": False,
                "message": "Booking not found",
            }), 404

        if result == "not_pending":
            return jsonify({
                "success": False,
                "message": "Only pending bookings can be cancelled",
            }), 409

        return jsonify({
            "success": True,
            "message": "Booking cancelled successfully",
        }), 200

    except Exception:
        app.logger.exception("Failed to cancel customer booking")

        return jsonify({
            "success": False,
            "message": "Could not cancel customer booking",
        }), 500


# --------------------------------------------------
# START LOCAL DEVELOPMENT SERVER
# --------------------------------------------------

if __name__ == "__main__":
    if not os.environ.get("LOCALRIDE_SECRET_KEY"):
        raise RuntimeError(
            "Set LOCALRIDE_SECRET_KEY before starting the server."
        )

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
