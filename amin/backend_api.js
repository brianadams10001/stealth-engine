// DEPRECATED
// Logic has been moved to worker.js to prevent exposing API keys on the client side.
// Please use the 'api/v1/admin/config' endpoint on your Worker.
export async function saveToCloudflareKV() {
    console.warn("This function is deprecated. Use the Worker API instead.");
}
