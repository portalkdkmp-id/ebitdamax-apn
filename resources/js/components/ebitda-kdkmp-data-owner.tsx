import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type EbitdaKdkmpDataOwner = {
    username: string;
    name: string;
    email: string;
};

type Props = {
    owner: EbitdaKdkmpDataOwner;
    options: EbitdaKdkmpDataOwner[];
    canSelect: boolean;
    onValueChange: (username: string) => void;
};

export function EbitdaKdkmpDataOwnerPanel({
    owner,
    options,
    canSelect,
    onValueChange,
}: Props) {
    return (
        <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Data milik
            </p>

            {canSelect ? (
                <Select value={owner.username} onValueChange={onValueChange}>
                    <SelectTrigger className="w-full sm:w-[360px]">
                        <SelectValue placeholder="Pilih user EBITDA KDKMP" />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem
                                key={option.username}
                                value={option.username}
                            >
                                {option.name} — {option.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <div>
                    <p className="truncate text-sm font-semibold">
                        {owner.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {owner.email}
                    </p>
                </div>
            )}
        </div>
    );
}
