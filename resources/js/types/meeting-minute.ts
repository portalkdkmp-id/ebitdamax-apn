export type MeetingMinuteItem = {
    id?: number;
    subject: string;
    description: string | null;
    action: string | null;
    objectives: string | null;
    date_start: string | null;
    date_finish: string | null;
    pic: string | null;
    status: string;
    remarks: string | null;
};

export type MeetingMinute = {
    id: number;
    title: string;
    meeting_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    attendees: string | null;
    items: MeetingMinuteItem[];
    created_at: string | null;
    updated_at: string | null;
};

export type MeetingMinuteFilters = {
    search: string;
};

export const MEETING_ITEM_STATUSES = [
    'open',
    'in_progress',
    'completed',
    'cancelled',
] as const;

export type MeetingItemStatus = (typeof MEETING_ITEM_STATUSES)[number];

export const STATUS_LABELS: Record<MeetingItemStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};
