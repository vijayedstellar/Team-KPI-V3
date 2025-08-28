// Utility functions for dynamic date handling across the application

/**
 * Generate a range of years starting from a base year
 * @param startYear - The starting year (default: 2024)
 * @param yearsIntoFuture - How many years into the future to include (default: 10)
 * @returns Array of year numbers
 */
export const generateYearRange = (startYear?: number, yearsIntoFuture: number = 10): number[] => {
  const currentYear = new Date().getFullYear();
  const baseYear = startYear || Math.min(2024, currentYear);
  const endYear = currentYear + yearsIntoFuture;
  
  const years: number[] = [];
  for (let year = baseYear; year <= endYear; year++) {
    years.push(year);
  }
  
  return years;
};

/**
 * Get the current year
 * @returns Current year as number
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Get the current month (1-12)
 * @returns Current month as number
 */
export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

/**
 * Generate month options for dropdowns
 * @returns Array of month objects with value and label
 */
export const getMonthOptions = () => [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

/**
 * Format a month number to its name
 * @param monthNumber - Month number (1-12)
 * @returns Month name
 */
export const formatMonthName = (monthNumber: number): string => {
  const months = getMonthOptions();
  return months.find(m => m.value === monthNumber)?.label || 'Unknown';
};

/**
 * Format a date period for display
 * @param startMonth - Start month number
 * @param startYear - Start year
 * @param endMonth - End month number  
 * @param endYear - End year
 * @returns Formatted period string
 */
export const formatPeriodLabel = (
  startMonth: number, 
  startYear: number, 
  endMonth: number, 
  endYear: number
): string => {
  const startMonthName = formatMonthName(startMonth);
  const endMonthName = formatMonthName(endMonth);
  return `${startMonthName} ${startYear} - ${endMonthName} ${endYear}`;
};

/**
 * Get default report period (Aug current year to Sep next year)
 * @returns Default period object
 */
export const getDefaultReportPeriod = () => {
  const currentYear = getCurrentYear();
  return {
    startMonth: 8, // August
    startYear: currentYear,
    endMonth: 9, // September  
    endYear: currentYear + 1
  };
};