import type { paths, components } from "@/sdk/api";

const API_HOST = import.meta.env.VITE_API_HOST?.replace(/\/$/, "") || "";

export async function createBox(
  body: paths["/api/boxes"]["post"]["requestBody"]["content"]["application/json"]
): Promise<components["schemas"]["Box"]> {
  const response = await fetch(`${API_HOST}/api/boxes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create box: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Fetch a single box by ID.
 */
export async function getBox(
  id: string
): Promise<components["schemas"]["Box"]> {
  const response = await fetch(`${API_HOST}/api/boxes/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch box: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Update a box's name by ID.
 */
export async function updateBox(
  id: string,
  body: paths["/api/boxes/{id}"]["put"]["requestBody"]["content"]["application/json"]
): Promise<components["schemas"]["Box"]> {
  const response = await fetch(`${API_HOST}/api/boxes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update box: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Fetch box-song relationships for a specific box with pagination support.
 */
export async function getBoxSongs(
  boxId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<
  paths["/api/boxes/{boxId}/songs"]["get"]["responses"]["200"]["content"]["application/json"]
> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.append("limit", options.limit.toString());
  }
  if (options?.offset !== undefined) {
    params.append("offset", options.offset.toString());
  }

  const url = params.toString()
    ? `${API_HOST}/api/boxes/${boxId}/songs?${params}`
    : `${API_HOST}/api/boxes/${boxId}/songs`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch box-songs: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Create a new user.
 */
export async function createUser(
  body: paths["/api/users"]["post"]["requestBody"]["content"]["application/json"]
): Promise<components["schemas"]["User"]> {
  const response = await fetch(`${API_HOST}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to create user:", errorBody);
    throw new Error(
      `Failed to create user: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Fetch a single user by ID.
 */
export async function getUser(
  id: string
): Promise<components["schemas"]["User"]> {
  const response = await fetch(`${API_HOST}/api/users/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch user: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Update a user by ID.
 */
export async function updateUser(
  id: string,
  body: paths["/api/users/{id}"]["put"]["requestBody"]["content"]["application/json"]
): Promise<components["schemas"]["User"]> {
  const response = await fetch(`${API_HOST}/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update user: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Fetch songs by multiple IDs.
 */
export async function getSongsByIds(
  ids: string[]
): Promise<components["schemas"]["Song"][]> {
  const idsParam = ids.join(",");
  const params = new URLSearchParams({ ids: idsParam });

  const response = await fetch(`${API_HOST}/api/songs/by-ids?${params}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch songs by IDs: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Fetch users by multiple IDs.
 */
export async function getUsersByIds(
  ids: string[]
): Promise<components["schemas"]["User"][]> {
  const idsParam = ids.join(",");
  const params = new URLSearchParams({ ids: idsParam });

  const response = await fetch(`${API_HOST}/api/users/by-ids?${params}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch users by IDs: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Create a new song.
 */
export async function createSong(
  body: paths["/api/songs"]["post"]["requestBody"]["content"]["application/json"]
): Promise<components["schemas"]["Song"]> {
  const response = await fetch(`${API_HOST}/api/songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create song: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Add a song to a box (create box-song relation).
 */
export async function createBoxSong(
  body: paths["/api/box_songs"]["post"]["requestBody"]["content"]["application/json"]
): Promise<components["schemas"]["BoxSong"]> {
  const response = await fetch(`${API_HOST}/api/box_songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to add song to box: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Update a box-song relationship.
 */
export async function updateBoxSong(
  id: string,
  body: NonNullable<
    paths["/api/box_songs/{id}"]["put"]["requestBody"]
  >["content"]["application/json"]
): Promise<components["schemas"]["BoxSong"]> {
  const response = await fetch(`${API_HOST}/api/box_songs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update box-song: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Search YouTube for songs.
 */
export async function searchYouTube(
  query: string,
  maxResults?: number
): Promise<
  paths["/api/youtube/search"]["get"]["responses"]["200"]["content"]["application/json"]
> {
  const params = new URLSearchParams({
    q: query,
    ...(maxResults && { maxResults: maxResults.toString() }),
  });

  const response = await fetch(`${API_HOST}/api/youtube/search?${params}`);
  if (!response.ok) {
    throw new Error(
      `Failed to search YouTube: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}

/**
 * Get a signed URL to stream audio-only content for a YouTube video from S3.
 */
export async function getYouTubeAudioSignedUrl(
  videoId: string
): Promise<
  paths["/api/youtube/audio"]["get"]["responses"]["200"]["content"]["application/json"]
> {
  const params = new URLSearchParams({ videoId });
  const response = await fetch(`${API_HOST}/api/youtube/audio?${params}`);
  if (!response.ok) {
    throw new Error(
      `Failed to get YouTube audio signed URL: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}
