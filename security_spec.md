# Security Specification - RSU Campus Timetable

## Data Invariants
- Users can only read/write their own profile.
- Only users with 'admin' role (or the specific creator) can create or update timetables.
- Students can read any published timetable.
- Timetable slots are managed by the creator of the parent timetable.

## Dirty Dozen Payloads (Rejections Expected)
1. Someone else's profile update.
2. Student creating a timetable.
3. Updating a timetable with a fake creatorId.
4. Deleting a timetable you didn't create.
5. Create a slot for a timetable you don't own.
6. Massive strings in courseCode.
7. Invalid days (e.g. "Funday").
8. Overwriting 'createdAt' after creation.
9. Modifying a published timetable status back to draft by a student.
10. Anonymous user reading any timetable.
11. Injecting PII into public fields.
12. Creating a timetable without required fields.
