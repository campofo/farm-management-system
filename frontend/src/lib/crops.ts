import { api } from "./api";
import { useQuery } from "@tanstack/react-query";

export type Crop = {
  id: number | string;
  name: string;
  variety?: string | null;
  field_name?: string | null;
  area_size?: number | null;
  planting_date?: string | null;
  expected_harvest_date?: string | null;
  status?: string | null;
  notes?: string | null;
};

export function useCrops() {
  return useQuery({
    queryKey: ["crops"],
    queryFn: () => api<Crop[]>("/api/crops"),
  });
}
