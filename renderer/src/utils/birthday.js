// renderer/src/utils/birthday.js

/**
 * Given a birthdate string (YYYY-MM-DD), compute:
 *   - age in full years as of today
 *   - daysUntilNext: 0 = today, positive = days away, wraps to next year
 *   - nextBirthday: Date object for the next occurrence
 */
export function computeBirthday(birthdateStr) {
	if (!birthdateStr) return null;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Parse YYYY-MM-DD without timezone shift
	const [year, month, day] = birthdateStr.split("-").map(Number);
	if (!year || !month || !day) return null;

	const birthDate = new Date(year, month - 1, day);

	// Age
	let age = today.getFullYear() - year;
	const hadBirthdayThisYear = today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
	if (!hadBirthdayThisYear) age -= 1;

	// Next birthday
	let nextBirthday = new Date(today.getFullYear(), month - 1, day);
	if (nextBirthday < today) {
		nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
	}

	const msPerDay = 1000 * 60 * 60 * 24;
	const daysUntilNext = Math.round((nextBirthday - today) / msPerDay);

	return { age, daysUntilNext, nextBirthday, birthDate };
}

/**
 * Group an array of birthday-enriched persons into buckets.
 * Expects each person to have a `_bday` field from computeBirthday().
 */
export function groupByProximity(persons) {
	const today = [];
	const next7Days = [];
	const next14Days = [];
	const months = {}; // { "May": [...], "June": [...] }

	persons.forEach((p) => {
		const d = p._bday.daysUntilNext;
		const date = p._bday.nextBirthday;

		if (d === 0) {
			today.push(p);
		} else if (d <= 7) {
			next7Days.push(p);
		} else if (d <= 14) {
			next14Days.push(p);
		} else {
			const monthName = date.toLocaleString("default", { month: "long" });
			if (!months[monthName]) months[monthName] = [];
			months[monthName].push(p);
		}
	});

	return { today, next7Days, next14Days, months };
}

/**
 * Format a relative birthday string, e.g. "Turns 32 in 3 days"
 */
export function formatBirthdayLine(bday) {
	const { age, daysUntilNext } = bday;
	const turnsAge = daysUntilNext === 0 ? age : age + 1;
	if (daysUntilNext === 0) return `🎂 Turns ${turnsAge} today!`;
	if (daysUntilNext === 1) return `Turns ${turnsAge} tomorrow`;
	return `Turns ${turnsAge} in ${daysUntilNext} days`;
}
