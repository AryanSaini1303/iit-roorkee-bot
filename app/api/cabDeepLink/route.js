import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function POST(req) {
  try {
    const { origin, destination, time } = await req.json();

    const pickup = origin.toLowerCase() === 'current location'
      ? null
      : await getPlaceDetails(origin);

    const drop = await getPlaceDetails(destination);

    if (!drop) {
      return NextResponse.json(
        { success: false, message: 'Invalid destination' },
        { status: 400 }
      );
    }

    const encodedPickup = pickup
      ? `pickup=${encodeURIComponent(JSON.stringify(pickup))}`
      : `pickup=my_location`;

    const encodedDrop = `drop%5B0%5D=${encodeURIComponent(JSON.stringify(drop))}`;

    const uberURL = `https://m.uber.com/go/product-selection?${encodedPickup}&${encodedDrop}`;

    return NextResponse.json({
      success: true,
      url: uberURL,
      meta: {
        pickup: pickup ? pickup.addressLine1 : 'Current Location',
        dropoff: drop.addressLine1,
        time: time || 'ASAP'
      }
    });
  } catch (err) {
    console.error('Uber Link Error:', err);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

async function getPlaceDetails(query) {
  // Step 1: Get place_id from Autocomplete
  const autocompleteURL = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    query
  )}&key=${GOOGLE_API_KEY}`;

  const autoRes = await fetch(autocompleteURL);
  const autoData = await autoRes.json();
//   console.log(autoData);

  if (!autoData?.predictions?.[0]) return null;

  const placeId = autoData.predictions[0].place_id;

  // Step 2: Get full details with place_id
  const detailsURL = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;

  const detailRes = await fetch(detailsURL);
  const detailData = await detailRes.json();

  const result = detailData.result;
  if (!result || !result.geometry) return null;

  const addressLine1 = result.name || result.formatted_address;
  const addressLine2 = result.formatted_address;
  const { lat, lng } = result.geometry.location;

  return {
    addressLine1,
    addressLine2,
    latitude: lat,
    longitude: lng,
    id: placeId,
    source: 'SEARCH',
    provider: 'google_places'
  };
}
