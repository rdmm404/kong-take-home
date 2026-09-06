export class VersionDto {
  id: number;
  version: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
