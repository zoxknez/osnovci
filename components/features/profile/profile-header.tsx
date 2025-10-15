"use client";

import { motion } from "framer-motion";
import { Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations/variants";

interface ProfileHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileHeader({
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: ProfileHeaderProps) {
  return (
    <motion.div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          👤 Profil deteta
        </h1>
        <p className="text-gray-600 mt-1">
          Kompletan zdravstveni i lični profil
        </p>
      </div>

      <div className="flex gap-2">
        {!isEditing ? (
          <Button
            onClick={onEdit}
            leftIcon={<Edit className="h-4 w-4" />}
            aria-label="Omogući izmenu profila"
          >
            Izmeni
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onCancel} aria-label="Otkaži izmene">
              Otkaži
            </Button>
            <Button
              onClick={onSave}
              loading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
              aria-label="Sačuvaj izmene profila"
            >
              {!isSaving && "Sačuvaj"}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
