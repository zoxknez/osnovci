"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuardianLink {
  studentId: string;
  isActive: boolean;
  student: {
    id: string;
    name: string;
    user: {
      id: string;
      email: string | null;
    };
  };
}

interface StudentSelectorProps {
  links: GuardianLink[];
  selectedStudentId: string;
}

export function StudentSelector({
  links,
  selectedStudentId,
}: StudentSelectorProps) {
  const router = useRouter();

  const handleStudentChange = (studentId: string) => {
    router.push(`/dashboard/roditelj?studentId=${studentId}`);
  };

  return (
    <Select value={selectedStudentId} onValueChange={handleStudentChange}>
      <SelectTrigger className="w-[250px]" aria-label="Izaberite učenika">
        <SelectValue placeholder="Izaberite učenika" />
      </SelectTrigger>
      <SelectContent>
        {links.map((link) => (
          <SelectItem key={link.studentId} value={link.studentId}>
            {link.student.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
