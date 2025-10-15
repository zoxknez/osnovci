"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import {
  Activity,
  AlertCircle,
  Droplet,
  Eye,
  FileText,
  Heart,
  MapPin,
  Phone,
  Pill,
  Ruler,
  Stethoscope,
  Syringe,
  User,
  Users,
  Weight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { staggerItem } from "@/lib/animations/variants";
import type { ProfileData, ProfileUpdateHandler } from "./types";
import { BLOOD_TYPE_OPTIONS, calculateBMI } from "./utils";

interface BasicInfoSectionProps {
  profile: ProfileData;
  isEditing: boolean;
  onChange: ProfileUpdateHandler;
  calculateAge: (birthDate: string) => number;
}

export function BasicInfoSection({
  profile,
  isEditing,
  onChange,
  calculateAge,
}: BasicInfoSectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Osnovne informacije
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoField
            label="Ime i prezime"
            value={profile.name}
            isEditing={isEditing}
            onChange={(value) => onChange("name", value)}
          />

          <InfoField
            label="Datum rođenja"
            value={new Date(profile.birthDate).toISOString().split("T")[0]}
            displayValue={`${new Date(profile.birthDate).toLocaleDateString("sr-RS")} (${calculateAge(profile.birthDate)} godina)`}
            type="date"
            isEditing={isEditing}
            onChange={(value) => onChange("birthDate", value)}
          />

          <InfoField
            label="Adresa"
            value={profile.address}
            isEditing={isEditing}
            onChange={(value) => onChange("address", value)}
            icon={<MapPin className="h-4 w-4" />}
          />

          <InfoField
            label="Škola"
            value={profile.school}
            isEditing={isEditing}
            onChange={(value) => onChange("school", value)}
          />

          <InfoField
            label="Razred"
            value={String(profile.grade)}
            displayValue={`${profile.grade}. razred`}
            type="number"
            min={1}
            max={8}
            isEditing={isEditing}
            onChange={(value) => onChange("grade", Number(value))}
          />

          <InfoField
            label="Odeljenje"
            value={profile.class}
            displayValue={`Odeljenje ${profile.class}`}
            isEditing={isEditing}
            onChange={(value) => onChange("class", value)}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface PhysicalSectionProps {
  profile: ProfileData;
  isEditing: boolean;
  onChange: ProfileUpdateHandler;
}

export function PhysicalSection({ profile, isEditing, onChange }: PhysicalSectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Fizičke karakteristike
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <InfoField
            label="Visina (cm)"
            value={String(profile.height)}
            type="number"
            isEditing={isEditing}
            icon={<Ruler className="h-4 w-4" />}
            onChange={(value) => onChange("height", Number(value))}
            displayContent={
              <MetricDisplay value={profile.height} unit="cm" accent="text-green-600" />
            }
          />

          <InfoField
            label="Težina (kg)"
            value={String(profile.weight)}
            type="number"
            isEditing={isEditing}
            icon={<Weight className="h-4 w-4" />}
            onChange={(value) => onChange("weight", Number(value))}
            displayContent={
              <MetricDisplay value={profile.weight} unit="kg" accent="text-blue-600" />
            }
          />

          <StaticField label="BMI">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calculateBMI(profile.height, profile.weight)}
              </div>
              <div className="text-xs text-gray-600">indeks</div>
            </div>
          </StaticField>

          <InfoField
            label="Veličina garderobe"
            value={profile.clothingSize}
            isEditing={isEditing}
            onChange={(value) => onChange("clothingSize", value)}
            displayContent={
              <div className="p-3 bg-gray-50 rounded-lg text-center font-medium">
                {profile.clothingSize}
              </div>
            }
          />

          <StaticField label="Naočare" icon={<Eye className="h-4 w-4" />} className="sm:col-span-2">
            <div
              className={`p-3 rounded-lg text-center font-medium ${
                profile.hasGlasses ? "bg-blue-100 text-blue-800" : "bg-gray-50 text-gray-600"
              }`}
            >
              {profile.hasGlasses ? "✓ Nosi naočare" : "Ne nosi naočare"}
            </div>
          </StaticField>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface HealthSectionProps {
  profile: ProfileData;
  isEditing: boolean;
  onChange: ProfileUpdateHandler;
}

export function HealthSection({ profile, isEditing, onChange }: HealthSectionProps) {
  const handleCommaSeparated = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Zdravstvene informacije
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <StaticField label="Krvna grupa" icon={<Droplet className="h-4 w-4" />}>
            {isEditing ? (
              <select
                value={profile.bloodType}
                onChange={(event) =>
                  onChange(
                    "bloodType",
                    event.target.value as ProfileData["bloodType"],
                  )
                }
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                {BLOOD_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold text-xl">
                <Droplet className="h-5 w-5" />
                {profile.bloodType}
              </div>
            )}
          </StaticField>

          <StaticField label="Alergije" icon={<AlertCircle className="h-4 w-4" />}>
            {isEditing ? (
              <Input
                value={profile.allergies.join(", ")}
                onChange={(event) => onChange("allergies", handleCommaSeparated(event.target.value))}
                placeholder="Unesite alergije odvojene zarezima"
              />
            ) : profile.allergies.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    ⚠️ {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyField message="Nema poznatih alergija" />
            )}
          </StaticField>

          {(isEditing || profile.healthNotes) && (
            <StaticField label="Zdravstvene napomene" icon={<FileText className="h-4 w-4" />}>
              {isEditing ? (
                <textarea
                  value={profile.healthNotes}
                  onChange={(event) => onChange("healthNotes", event.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                  placeholder="Važne napomene o zdravlju deteta"
                />
              ) : (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                  <p className="text-gray-800">{profile.healthNotes}</p>
                </div>
              )}
            </StaticField>
          )}

          {(isEditing || profile.medications.length > 0) && (
            <StaticField label="Trenutna terapija" icon={<Pill className="h-4 w-4" />}>
              {isEditing ? (
                <Input
                  value={profile.medications.join(", ")}
                  onChange={(event) =>
                    onChange("medications", handleCommaSeparated(event.target.value))
                  }
                  placeholder="Lekovi odvojeni zarezima (npr. Aspirin, Paracetamol)"
                />
              ) : profile.medications.length ? (
                <div className="space-y-2">
                  {profile.medications.map((medication) => (
                    <div key={medication} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      {medication}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyField message="Trenutno nema terapije" />
              )}
            </StaticField>
          )}

          {(isEditing || profile.chronicIllnesses.length > 0) && (
            <StaticField label="Hronične bolesti" icon={<AlertCircle className="h-4 w-4" />}>
              {isEditing ? (
                <Input
                  value={profile.chronicIllnesses.join(", ")}
                  onChange={(event) =>
                    onChange("chronicIllnesses", handleCommaSeparated(event.target.value))
                  }
                  placeholder="Hronična stanja odvojena zarezima"
                />
              ) : profile.chronicIllnesses.length ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {profile.chronicIllnesses.map((condition) => (
                    <li key={condition}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <EmptyField message="Nema evidentiranih hroničnih stanja" />
              )}
            </StaticField>
          )}

          {(isEditing || profile.specialNeeds) && (
            <StaticField label="Posebne potrebe" icon={<Users className="h-4 w-4" />}>
              {isEditing ? (
                <textarea
                  value={profile.specialNeeds}
                  onChange={(event) => onChange("specialNeeds", event.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                  placeholder="Dodatne informacije o podršci učeniku"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {profile.specialNeeds || "Nema specifičnih potreba"}
                </div>
              )}
            </StaticField>
          )}

          <StaticField label="Vakcinacioni karton" icon={<Syringe className="h-4 w-4" />}>
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.vaccinations.map((vaccination) => (
                <div key={`${vaccination.name}-${vaccination.date}`} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-900">{vaccination.name}</span>
                    {vaccination.booster && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        Revakcina
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    {new Date(vaccination.date).toLocaleDateString("sr-RS")}
                  </div>
                </div>
              ))}
            </div>
          </StaticField>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ContactsSectionProps {
  profile: ProfileData;
  isEditing: boolean;
  onChange: ProfileUpdateHandler;
}

export function ContactsSection({ profile, isEditing, onChange }: ContactsSectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-cyan-600" />
            Lekari i hitni kontakti
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ContactCard
            title="Primarni lekar"
            icon={<Stethoscope className="h-5 w-5 text-cyan-600" />}
            name={profile.primaryDoctor}
            phone={profile.primaryDoctorPhone}
            isEditing={isEditing}
            onNameChange={(value) => onChange("primaryDoctor", value)}
            onPhoneChange={(value) => onChange("primaryDoctorPhone", value)}
            accent="cyan"
          />

          <ContactCard
            title="Stomatolog"
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            name={profile.dentist}
            phone={profile.dentistPhone}
            isEditing={isEditing}
            onNameChange={(value) => onChange("dentist", value)}
            onPhoneChange={(value) => onChange("dentistPhone", value)}
            accent="blue"
          />

          <ContactCard
            title="Hitni kontakt 1"
            icon={<AlertCircle className="h-5 w-5 text-red-600" />}
            name={profile.emergencyContact1}
            phone={profile.emergencyContact1Phone}
            isEditing={isEditing}
            onNameChange={(value) => onChange("emergencyContact1", value)}
            onPhoneChange={(value) => onChange("emergencyContact1Phone", value)}
            accent="red"
          />

          <ContactCard
            title="Hitni kontakt 2"
            icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
            name={profile.emergencyContact2}
            phone={profile.emergencyContact2Phone}
            isEditing={isEditing}
            onNameChange={(value) => onChange("emergencyContact2", value)}
            onPhoneChange={(value) => onChange("emergencyContact2Phone", value)}
            accent="orange"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ActivitiesSectionProps {
  profile: ProfileData;
  isEditing: boolean;
  onChange: ProfileUpdateHandler;
}

export function ActivitiesSection({ profile, isEditing, onChange }: ActivitiesSectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Aktivnosti i interesovanja
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <InfoField
            label="🎨 Hobiji"
            value={profile.hobbies}
            isEditing={isEditing}
            onChange={(value) => onChange("hobbies", value)}
          />

          <InfoField
            label="⚽ Sportovi"
            value={profile.sports}
            isEditing={isEditing}
            onChange={(value) => onChange("sports", value)}
          />

          <InfoField
            label="🎭 Vannastavne aktivnosti"
            value={profile.activities}
            isEditing={isEditing}
            onChange={(value) => onChange("activities", value)}
          />

          {(isEditing || profile.notes) && (
            <StaticField label="Napomene" icon={<FileText className="h-4 w-4" />}>
              {isEditing ? (
                <textarea
                  value={profile.notes}
                  onChange={(event) => onChange("notes", event.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
                  placeholder="Dodatne beleške o učeniku"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  {profile.notes || "Nema dodatnih napomena"}
                </div>
              )}
            </StaticField>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isEditing: boolean;
  type?: string;
  displayValue?: string;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
  displayContent?: React.ReactNode;
}

function InfoField({
  label,
  value,
  displayValue,
  onChange,
  isEditing,
  type = "text",
  min,
  max,
  icon,
  displayContent,
}: InfoFieldProps) {
  const inputId = useId();
  const LabelTag = (isEditing ? "label" : "div") as "label" | "div";
  const labelProps = isEditing ? { htmlFor: inputId } : {};

  return (
    <div>
      <LabelTag
        className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
        {...labelProps}
      >
        {icon}
        {label}
      </LabelTag>
      {isEditing ? (
        <Input
          id={inputId}
          value={value}
          type={type}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : displayContent ? (
        displayContent
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg">
          {displayValue ?? value}
        </div>
      )}
    </div>
  );
}

interface StaticFieldProps {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function StaticField({ label, children, icon, className }: StaticFieldProps) {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

interface MetricDisplayProps {
  value: number;
  unit: string;
  accent: string;
}

function MetricDisplay({ value, unit, accent }: MetricDisplayProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-gray-600">{unit}</div>
    </div>
  );
}

function EmptyField({ message }: { message: string }) {
  return <div className="p-3 bg-gray-50 rounded-lg text-gray-600 italic">{message}</div>;
}

interface ContactCardProps {
  title: string;
  icon: React.ReactNode;
  name: string;
  phone: string;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  isEditing: boolean;
  accent: "cyan" | "blue" | "red" | "orange";
}

function ContactCard({
  title,
  icon,
  name,
  phone,
  onNameChange,
  onPhoneChange,
  isEditing,
  accent,
}: ContactCardProps) {
  const palette: Record<
    ContactCardProps["accent"],
    {
      container: string;
      heading: string;
      icon: string;
      link: string;
    }
  > = {
    cyan: {
      container: "bg-cyan-50 border border-cyan-200",
      heading: "text-cyan-900",
      icon: "text-cyan-600",
      link: "text-cyan-700",
    },
    blue: {
      container: "bg-blue-50 border border-blue-200",
      heading: "text-blue-900",
      icon: "text-blue-600",
      link: "text-blue-700",
    },
    red: {
      container: "bg-red-50 border-2 border-red-300",
      heading: "text-red-900",
      icon: "text-red-600",
      link: "text-red-700",
    },
    orange: {
      container: "bg-orange-50 border-2 border-orange-300",
      heading: "text-orange-900",
      icon: "text-orange-600",
      link: "text-orange-700",
    },
  };

  const colors = palette[accent];

  return (
    <div className={`${colors.container} rounded-lg space-y-3 p-4`}>
      <div className="flex items-center gap-2">
        {icon}
        <div className={`font-semibold ${colors.heading}`}>{title}</div>
      </div>
      {isEditing ? (
        <>
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ime i prezime"
          />
          <Input
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            placeholder="Telefon"
            type="tel"
          />
        </>
      ) : (
        <>
          <div className="text-gray-800 font-medium">{name}</div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className={`h-4 w-4 ${colors.icon}`} />
            <a href={`tel:${phone}`} className={`${colors.link} hover:underline font-medium`}>
              {phone}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
