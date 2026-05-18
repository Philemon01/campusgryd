import { google } from 'googleapis';

export async function syncToGoogleCalendar(accessToken: string, slots: any[]) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];

  for (const slot of slots) {
    // Calculate first occurrence
    const event = {
      summary: `${slot.courseCode}: ${slot.courseTitle}`,
      location: slot.venue,
      description: `Lecturer: ${slot.lecturer}\nSynced from RSU Campus Map`,
      start: {
        dateTime: getNextOccurrence(slot.day, slot.startTime),
        timeZone: 'Africa/Lagos',
      },
      end: {
        dateTime: getNextOccurrence(slot.day, slot.endTime),
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

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      results.push(response.data);
    } catch (error) {
      console.error(`Error inserting event for ${slot.courseCode}:`, error);
      throw error;
    }
  }

  return results;
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
  return map[day];
}

function getNextOccurrence(dayStr: string, timeStr: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(dayStr);
  const now = new Date();
  const currentDay = now.getDay();
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  
  const targetDate = new Date();
  targetDate.setDate(now.getDate() + daysUntil);
  targetDate.setHours(hours, minutes, 0, 0);
  
  // If it's today but the time has passed, move to next week
  if (daysUntil === 0 && targetDate < now) {
    targetDate.setDate(targetDate.getDate() + 7);
  }
  
  return targetDate.toISOString();
}
