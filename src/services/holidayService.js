import { format } from 'date-fns';

export const holidayService = {
  async loadHolidays(year) {
    try {
      const response = await fetch(`/data/holidays-${year}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load holidays for ${year}`);
      }
      const holidays = await response.json();
      return holidays.map(holiday => ({
        ...holiday,
        date: new Date(holiday.date)
      }));
    } catch (error) {
      return [];
    }
  },

  async getHolidaysForDateRange(startDate, endDate) {
    const years = new Set();
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      years.add(currentDate.getFullYear());
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }

    const allHolidays = [];
    for (const year of years) {
      const yearHolidays = await this.loadHolidays(year);
      allHolidays.push(...yearHolidays);
    }

    return allHolidays.filter(holiday => 
      holiday.date >= startDate && holiday.date <= endDate
    );
  }
};