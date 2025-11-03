// util/calculateEstimatedDuration.ts

/**
 * Calcule la durée estimée entre deux dates (departureTime et estimatedArrival)
 * et retourne une chaîne au format "HH:MM".
 *
 * @param departureTime - Date ou string ISO de départ
 * @param estimatedArrival - Date ou string ISO d'arrivée estimée
 * @returns Durée estimée au format "HH:MM"
 */
export function calculateEstimatedDuration(
    departureTime: string | Date,
    estimatedArrival: string | Date
): string {
    const departure = new Date(departureTime).getTime();
    const arrival = new Date(estimatedArrival).getTime();

    if (isNaN(departure) || isNaN(arrival) || arrival <= departure) {
        return "00:00";
    }

    const diffMinutes = Math.floor((arrival - departure) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
