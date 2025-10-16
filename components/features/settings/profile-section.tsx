"use client";

import { motion } from "framer-motion";
import { Camera, Mail, Phone, School, Upload, User } from "lucide-react";
import { useId, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { staggerItem } from "@/lib/animations/variants";
import type { ProfileSettings } from "./types";

interface ProfileSectionProps {
  profile: ProfileSettings;
  isSavingAvatar: boolean;
  onAvatarUpload: () => Promise<void>;
  onFieldChange: (field: keyof ProfileSettings, value: string) => Promise<void>;
  onFieldInput: (field: keyof ProfileSettings, value: string) => void;
}

export function ProfileSection({
  profile,
  isSavingAvatar,
  onAvatarUpload,
  onFieldChange,
  onFieldInput,
}: ProfileSectionProps) {
  const studentLabel = useMemo(
    () => `Učenik, ${profile.class}`,
    [profile.class],
  );

  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {profile.name.at(0) ?? "?"}
              </motion.div>
              <motion.button
                onClick={onAvatarUpload}
                disabled={isSavingAvatar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {isSavingAvatar ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </motion.button>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Promeni</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{profile.name}</h3>
              <p className="text-sm text-gray-600">{studentLabel}</p>
              <motion.button
                onClick={onAvatarUpload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-2 px-4 py-1.5 text-sm border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all touch-manipulation"
              >
                {isSavingAvatar ? "Uploading..." : "Promeni sliku"}
              </motion.button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AutoSaveInput
              label="Email"
              type="email"
              icon={<Mail className="h-4 w-4 text-gray-400" />}
              value={profile.email}
              onChange={(value) => onFieldInput("email", value)}
              onBlur={(value) => onFieldChange("email", value)}
            />
            <AutoSaveInput
              label="Telefon"
              type="tel"
              icon={<Phone className="h-4 w-4 text-gray-400" />}
              value={profile.phone}
              onChange={(value) => onFieldInput("phone", value)}
              onBlur={(value) => onFieldChange("phone", value)}
            />
            <AutoSaveInput
              label="Škola"
              icon={<School className="h-4 w-4 text-gray-400" />}
              value={profile.school}
              onChange={(value) => onFieldInput("school", value)}
              onBlur={(value) => onFieldChange("school", value)}
            />
            <AutoSaveInput
              label="Razred"
              value={profile.class}
              onChange={(value) => onFieldInput("class", value)}
              onBlur={(value) => onFieldChange("class", value)}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AutoSaveInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => Promise<void>;
  type?: string;
  icon?: React.ReactNode;
}

function AutoSaveInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  icon,
}: AutoSaveInputProps) {
  const inputId = useId();
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700 flex items-center gap-2"
      >
        {label}
        <span className="text-xs text-gray-500">(auto-save)</span>
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
        <Input
          id={inputId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => void onBlur(event.target.value)}
          className={icon ? "pl-10" : undefined}
        />
      </div>
    </div>
  );
}
