import type { Crop } from "@/lib/crops";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CropSelect({
  crops,
  value,
  onChange,
  placeholder = "Select crop",
  allowAll = false,
  required = false,
}: {
  crops: Crop[] | undefined;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  allowAll?: boolean;
  required?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} required={required}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">All crops</SelectItem>}
        {crops?.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
            {c.field_name ? ` · ${c.field_name}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
