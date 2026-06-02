import { google } from 'googleapis';

export async function syncToGoogleCalendar(accessToken: string, slots: any[]) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });
  console.log(`Starting sync for ${slots.length} slots...`);

  // Use Promise.all with Promise.allSettled behavior or just map and wait
  const syncPromises = slots.map(async (slot) => {
    try {
      const { start, end } = getSlotTimes(slot.day, slot.startTime, slot.endTime);
      
      const event = {
        summary: `${slot.courseCode}: ${slot.courseTitle}`,
        location: slot.venue,
        description: `Lecturer: ${slot.lecturer || 'Not Specified'}\nSynced from Campusgryd`,
        start: {
          dateTime: start,
          timeZone: 'Africa/Lagos',
        },
        end: {
          dateTime: end,
          timeZone: 'Africa/Lagos',
        },
        recurrence: [
          `RRULE:FREQ=WEEKLY;BYDAY=${getDayAbbreviation(slot.day)}`
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      return { 
        id: response.data.id, 
        courseCode: slot.courseCode,
        summary: event.summary 
      };
    } catch (error: any) {
      console.error(`Error inserting event for ${slot.courseCode}:`, error?.response?.data || error);
      throw new Error(`Failed to sync ${slot.courseCode}: ${error?.response?.data?.error?.message || error.message}`);
    }
  });

  const results = await Promise.all(syncPromises);
  console.log(`Successfully synced ${results.length} events!`);
  return results;
}

export async function deleteFromGoogleCalendar(accessToken: string, eventIds: string[]) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });
  console.log(`Starting deletion of ${eventIds.length} events...`);

  const deletePromises = eventIds.map(async (eventId) => {
    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      return { id: eventId, success: true };
    } catch (error: any) {
      // If event is already deleted, count as success
      if (error.code === 410 || error.code === 404) {
        return { id: eventId, success: true, alreadyDeleted: true };
      }
      console.error(`Error deleting event ${eventId}:`, error?.response?.data || error);
      return { id: eventId, success: false, error: error.message };
    }
  });

  return await Promise.all(deletePromises);
}

function getDayAbbreviation(day: string) {
  const map: Record<string, string> = {
    'Monday': 'MO',
    'Tuesday': 'TU',
    'Wednesday': 'WE',
    'Thursday': 'TH',
    'Friday': 'FR',
    'Saturday': 'SA',
    'Sunday': 'SU'
  };
  return map[day] || 'MO'; // Fallback to Monday
}

function getSlotTimes(dayStr: string, startTimeStr: string, endTimeStr: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(dayStr);
  const now = new Date();
  const currentDay = now.getDay();
  
  if (targetDay === -1) throw new Error(`Invalid day: ${dayStr}`);
  
  const parseTime = (time: string) => {
    if (!time || !time.includes(':')) return [8, 0];
    return time.split(':').map(Number);
  };

  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  
  const startDate = new Date();
  startDate.setDate(now.getDate() + daysUntil);
  const [sHours, sMinutes] = parseTime(startTimeStr);
  startDate.setHours(sHours || 0, sMinutes || 0, 0, 0);

  const endDate = new Date();
  endDate.setDate(now.getDate() + daysUntil);
  const [eHours, eMinutes] = parseTime(endTimeStr);
  endDate.setHours(eHours || 0, eMinutes || 0, 0, 0);
  
  // If the class has already ended today, move to next week
  if (daysUntil === 0 && endDate < now) {
    startDate.setDate(startDate.getDate() + 7);
    endDate.setDate(endDate.getDate() + 7);
  }

  // Safety check: Ensure the time range is not empty or negative
  if (endDate <= startDate) {
    console.warn(`Adjusting invalid time range for ${dayStr}: ${startTimeStr} - ${endTimeStr}`);
    endDate.setTime(startDate.getTime() + 60 * 60 * 1000); 
  }
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}
