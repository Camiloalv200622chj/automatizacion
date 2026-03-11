/**
 * Utility to handle accounting periods.
 * Requirement RF-04: Certificates for January are paid in December of the previous year.
 */

const MONTHS = [
    '01-Enero', '02-Febrero', '03-Marzo', '04-Abril',
    '05-Mayo', '06-Junio', '07-Julio', '08-Agosto',
    '09-Septiembre', '10-Octubre', '11-Noviembre', '12-Diciembre'
];

/**
 * Calculates the period to process based on the current date.
 * If we are in March 2026, we process February 2026.
 * If we are in January 2026, we process December 2025.
 * @returns {Object} { period: "YYYY-MM", year: "YYYY", monthName: "MM-Month" }
 */
export const getCurrentProcessingPeriod = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-11 (Jan is 0)

    // Move to previous month
    if (month === 0) {
        month = 11;
        year = year - 1;
    } else {
        month = month - 1;
    }

    const monthNum = (month + 1).toString().padStart(2, '0');
    const monthName = MONTHS[month];
    
    return {
        period: `${year}-${monthNum}`,
        year: year.toString(),
        monthName: monthName
    };
};
