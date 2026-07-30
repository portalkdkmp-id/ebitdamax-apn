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

export type MeetingMinuteAttachment = {
    id: number;
    name: string;
    mime_type: string | null;
    size: number;
    preview_url: string;
    download_url: string;
};

export type MeetingMinute = {
    id: number;
    title: string;
    meeting_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    attendees: string | null;
    creator: {
        id: number;
        name: string;
        username: string | null;
        email: string;
    } | null;
    items: MeetingMinuteItem[];
    attachments: MeetingMinuteAttachment[];
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

export type MeetingActionItemStatusHistory = {
    id: number;
    from_status: MeetingItemStatus;
    to_status: MeetingItemStatus;
    note: string | null;
    changed_by_name: string;
    created_at: string | null;
};

export type MeetingActionItem = {
    id: number;
    subject: string;
    action: string | null;
    pic: string | null;
    date_start: string | null;
    date_finish: string | null;
    status: MeetingItemStatus;
    remarks: string | null;
    is_overdue: boolean;
    meeting_minute: {
        id: number;
        title: string;
        meeting_date: string | null;
        creator: {
            id: number;
            name: string;
        } | null;
    };
    status_histories: MeetingActionItemStatusHistory[];
};

export type MeetingActionItemFilters = {
    search: string;
    status: MeetingItemStatus | '';
    overdue: boolean;
};

export type MeetingActionItemSummary = {
    total: number;
    open: number;
    in_progress: number;
    completed: number;
    overdue: number;
};
