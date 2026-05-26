export interface Participant {
  id: string;
  name: string;
  timezone: string;       // IANA zone, e.g. "Asia/Kolkata"
  availability: number[]; // sorted UTC 15-min slot indices
  color: string;          // hex color assigned at creation
  /** Free-text note attributed to this participant. Visible to everyone, editable only by them. */
  note?: string;
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
  /** Hex color from the shared palette. Server validates uniqueness across participants. */
  color?: string;
  /** Optional free-text note this participant wants visible to everyone. */
  note?: string;
}
