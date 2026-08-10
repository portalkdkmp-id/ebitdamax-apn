export type UserNotification = {
    id: string;
    title: string;
    message: string;
    sender_name: string | null;
    created_at: string | null;
    read_at: string | null;
};

export type NotificationCenter = {
    unread_count: number;
    items: UserNotification[];
};
