// app/api/workers/assign/route.js
// Worker assignment algorithm based on service, location, and availability

import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db.js';

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Calculate estimated time of arrival based on distance
// Assuming average speed of 25 km/h in city traffic
function calculateETA(distanceKm) {
  const avgSpeedKmh = 25;
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.ceil(timeHours * 60);

  if (timeMinutes < 60) {
    return `${timeMinutes} minutes`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const mins = timeMinutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
  }
}

// Find the best available worker for a service at a given location
export async function findBestWorker(serviceId, customerLat, customerLng) {
  try {
    // Get all active and approved workers who can provide this service
    // Join with worker_services to filter by service capability
    // Only include workers who have been approved (approved_at and approved_by are NOT NULL)
    const query = `
      SELECT
        w.id,
        w.worker_code,
        w.first_name,
        w.last_name,
        w.phone,
        w.email,
        w.current_location_lat,
        w.current_location_lng,
        w.city,
        w.average_rating,
        w.total_jobs_completed,
        ws.skill_level
      FROM workers w
      INNER JOIN worker_services ws ON w.id = ws.worker_id
      WHERE w.status = 'Active'
        AND w.is_available = 1
        AND w.approved_at IS NOT NULL
        AND w.approved_by IS NOT NULL
        AND ws.service_id = ?
        AND ws.is_active = 1
      ORDER BY w.average_rating DESC, w.total_jobs_completed DESC
    `;

    const workers = await executeQuery(query, [serviceId]);

    if (workers.length === 0) {
      return null;
    }

    // If customer has location, sort by distance
    if (customerLat && customerLng) {
      const workersWithDistance = workers.map((worker) => {
        let distance = Infinity;
        if (worker.current_location_lat && worker.current_location_lng) {
          distance = calculateDistance(
            customerLat,
            customerLng,
            parseFloat(worker.current_location_lat),
            parseFloat(worker.current_location_lng)
          );
        }
        return {
          ...worker,
          distance,
          eta: distance !== Infinity ? calculateETA(distance) : 'To be confirmed',
        };
      });

      // Sort by distance (nearest first), then by rating
      workersWithDistance.sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return (b.average_rating || 0) - (a.average_rating || 0);
      });

      // Filter out workers beyond 50km (configurable)
      const maxDistance = 50; // km
      const nearbyWorkers = workersWithDistance.filter((w) => w.distance <= maxDistance);

      if (nearbyWorkers.length > 0) {
        return nearbyWorkers[0];
      }

      // If no workers within range, return the closest one anyway
      return workersWithDistance[0];
    }

    // Without location, just return the highest rated available worker
    return {
      ...workers[0],
      distance: null,
      eta: 'To be confirmed',
    };
  } catch (error) {
    console.error('Error finding best worker:', error);
    throw error;
  }
}

// POST endpoint to manually assign a worker
export async function POST(request) {
  try {
    const { bookingId, serviceId, customerLat, customerLng } = await request.json();

    if (!bookingId || !serviceId) {
      return NextResponse.json(
        { success: false, message: 'Booking ID and Service ID are required' },
        { status: 400 }
      );
    }

    const worker = await findBestWorker(serviceId, customerLat, customerLng);

    if (!worker) {
      return NextResponse.json(
        {
          success: false,
          message: 'No available workers found for this service in your area',
        },
        { status: 404 }
      );
    }

    // Update the booking with the assigned worker
    await executeQuery(
      `UPDATE service_bookings
       SET assigned_worker_id = ?,
           assigned_at = NOW(),
           status = 'Assigned',
           updated_at = NOW()
       WHERE id = ? OR booking_code = ?`,
      [worker.id, bookingId, bookingId]
    );

    // Mark the worker as unavailable (busy with this job)
    // Optionally, you can implement a more sophisticated availability system
    // await executeQuery(
    //   'UPDATE workers SET is_available = 0 WHERE id = ?',
    //   [worker.id]
    // );

    return NextResponse.json({
      success: true,
      message: 'Worker assigned successfully',
      worker: {
        id: worker.id,
        name: `${worker.first_name} ${worker.last_name}`,
        phone: worker.phone,
        email: worker.email,
        rating: worker.average_rating,
        distance: worker.distance ? `${worker.distance.toFixed(1)} km` : null,
        eta: worker.eta,
      },
    });
  } catch (error) {
    console.error('Error assigning worker:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to assign worker' },
      { status: 500 }
    );
  }
}

// GET endpoint to find available workers for a service
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!serviceId) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get all active and approved workers who can provide this service
    const query = `
      SELECT
        w.id,
        w.worker_code,
        w.first_name,
        w.last_name,
        w.phone,
        w.current_location_lat,
        w.current_location_lng,
        w.city,
        w.average_rating,
        w.total_jobs_completed,
        ws.skill_level
      FROM workers w
      INNER JOIN worker_services ws ON w.id = ws.worker_id
      WHERE w.status = 'Active'
        AND w.is_available = 1
        AND w.approved_at IS NOT NULL
        AND w.approved_by IS NOT NULL
        AND ws.service_id = ?
        AND ws.is_active = 1
      ORDER BY w.average_rating DESC
    `;

    const workers = await executeQuery(query, [serviceId]);

    // Calculate distance and ETA for each worker
    const workersWithDistance = workers.map((worker) => {
      let distance = null;
      let eta = 'To be confirmed';

      if (lat && lng && worker.current_location_lat && worker.current_location_lng) {
        distance = calculateDistance(
          lat,
          lng,
          parseFloat(worker.current_location_lat),
          parseFloat(worker.current_location_lng)
        );
        eta = calculateETA(distance);
      }

      return {
        id: worker.id,
        name: `${worker.first_name} ${worker.last_name}`,
        phone: worker.phone,
        city: worker.city,
        rating: worker.average_rating || 0,
        jobsCompleted: worker.total_jobs_completed || 0,
        skillLevel: worker.skill_level,
        distance: distance ? `${distance.toFixed(1)} km` : null,
        distanceValue: distance,
        eta,
      };
    });

    // Sort by distance if location provided
    if (lat && lng) {
      workersWithDistance.sort((a, b) => {
        if (a.distanceValue === null) return 1;
        if (b.distanceValue === null) return -1;
        return a.distanceValue - b.distanceValue;
      });
    }

    return NextResponse.json({
      success: true,
      workers: workersWithDistance.slice(0, limit),
      total: workersWithDistance.length,
    });
  } catch (error) {
    console.error('Error finding workers:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to find workers' },
      { status: 500 }
    );
  }
}
