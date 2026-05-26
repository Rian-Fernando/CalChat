export interface Participant {
  id: string;
  name: string;
  timezone: string;       // IANA zone, e.g. "Asia/Kolkata"
  availability: number[]; // sorted UTC epoch hours (ms / 3_600_000)
  color: string;          // hex color assigned at creation
  updatedAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  weekStartDate: string;  // "YYYY-MM-DD", interpreted as Monday in each participant's local TZ
  createdAt: number;
  participants: Record<string, Participant>;
}

export interface UpsertParticipantPayload {
  participantId: string;
  name: string;
  timezone: string;
  availability: number[];
}
