// Profil deteta - Kompletan zdravstveni i lični profil
"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Droplet,
  Edit,
  Eye,
  FileText,
  Heart,
  MapPin,
  Phone,
  Pill,
  Ruler,
  Save,
  Shield,
  Stethoscope,
  Syringe,
  User,
  Users,
  Weight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations/variants";

type BloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"
  | "Nepoznata";

interface ProfileData {
  name: string;
  birthDate: string;
  address: string;
  school: string;
  grade: number;
  class: string;
  height: number;
  weight: number;
  clothingSize: string;
  hasGlasses: boolean;
  bloodType: BloodType;
  allergies: string[];
  chronicIllnesses: string[];
  medications: string[];
  healthNotes: string;
  specialNeeds: string;
  vaccinations: Array<{ name: string; date: string; booster: boolean }>;
  primaryDoctor: string;
  primaryDoctorPhone: string;
  dentist: string;
  dentistPhone: string;
  emergencyContact1: string;
  emergencyContact1Phone: string;
  emergencyContact2: string;
  emergencyContact2Phone: string;
  hobbies: string;
  sports: string;
  activities: string;
  notes: string;
}

export default function ProfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock data - TODO: Load from database
  const [profile, setProfile] = useState<ProfileData>({
    // Osnovne informacije
    name: "Marko Marković",
    birthDate: "2014-05-15",
    address: "Kneza Miloša 25, Beograd",
    school: 'OŠ "Vuk Karadžić"',
    grade: 5,
    class: "B",

    // Fizičke karakteristike
    height: 145, // cm
    weight: 38, // kg
    clothingSize: "152",
    hasGlasses: true,

    // Zdravstvene informacije
    bloodType: "A+" as BloodType,
    allergies: ["Kikiriki", "Pelud breze"],
    chronicIllnesses: [],
    medications: [],
    healthNotes: "Nosi inhalator za astmu u torbi",
    specialNeeds: "",

    // Vakcinacije
    vaccinations: [
      { name: "BCG", date: "2014-06-01", booster: false },
      { name: "MMR", date: "2015-06-15", booster: false },
      { name: "DTaP", date: "2014-08-15", booster: true },
    ],

    // Lekari i hitni kontakti
    primaryDoctor: "Dr. Jovana Nikolić",
    primaryDoctorPhone: "011/123-4567",
    dentist: "Dr. Petar Simić",
    dentistPhone: "011/765-4321",
    emergencyContact1: "Ana Marković (majka)",
    emergencyContact1Phone: "065/123-4567",
    emergencyContact2: "Petar Marković (otac)",
    emergencyContact2Phone: "064/987-6543",

    // Aktivnosti
    hobbies: "Čitanje, crtanje, šah",
    sports: "Fudbal, plivanje",
    activities: "Dramska sekcija, programiranje",
    notes: "",
  });

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // TODO: Save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("✅ Profil sačuvan!", {
        description: "Sve promene su uspešno sačuvane.",
      });

      setIsEditing(false);
    } catch (_error) {
      toast.error("Greška prilikom čuvanja profila");
    } finally {
      setIsSaving(false);
    }
  };

  const bloodTypeOptions: BloodType[] = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "Nepoznata",
  ];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const calculateBMI = (height: number, weight: number) => {
    const heightInM = height / 100;
    return (weight / (heightInM * heightInM)).toFixed(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
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
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit className="h-4 w-4" />}
              aria-label="Omogući izmenu profila"
            >
              Izmeni
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                aria-label="Otkaži izmene"
              >
                Otkaži
              </Button>
              <Button
                onClick={handleSave}
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

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg"
      >
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-blue-900 mb-1">
              🔒 Privatnost i sigurnost
            </div>
            <div className="text-sm text-blue-800">
              Sve zdravstvene informacije su šifrovane i vidljive samo
              roditeljima i ovlašćenom osoblju škole. Podaci se koriste
              isključivo za bezbednost i dobrobit deteta.
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Osnovne informacije */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Osnovne informacije
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ime i prezime
                </label>
                {isEditing ? (
                  <Input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg font-medium">
                    {profile.name}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Datum rođenja
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={profile.birthDate}
                    onChange={(e) =>
                      setProfile({ ...profile, birthDate: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {new Date(profile.birthDate).toLocaleDateString("sr-RS")} (
                    {calculateAge(profile.birthDate)} godina)
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresa
                </label>
                {isEditing ? (
                  <Input
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {profile.address}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Škola
                </label>
                {isEditing ? (
                  <Input
                    value={profile.school}
                    onChange={(e) =>
                      setProfile({ ...profile, school: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {profile.school}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Razred
                  </label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      max="8"
                      value={profile.grade}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          grade: Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {profile.grade}. razred
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Odeljenje
                  </label>
                  {isEditing ? (
                    <Input
                      value={profile.class}
                      onChange={(e) =>
                        setProfile({ ...profile, class: e.target.value })
                      }
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      Odeljenje {profile.class}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fizičke karakteristike */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Fizičke karakteristike
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Visina (cm)
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={profile.height}
                    onChange={(e) =>
                      setProfile({ ...profile, height: Number(e.target.value) })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {profile.height}
                    </div>
                    <div className="text-xs text-gray-600">cm</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Težina (kg)
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={profile.weight}
                    onChange={(e) =>
                      setProfile({ ...profile, weight: Number(e.target.value) })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {profile.weight}
                    </div>
                    <div className="text-xs text-gray-600">kg</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  BMI
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateBMI(profile.height, profile.weight)}
                  </div>
                  <div className="text-xs text-gray-600">indeks</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Veličina garderobe
                </label>
                {isEditing ? (
                  <Input
                    value={profile.clothingSize}
                    onChange={(e) =>
                      setProfile({ ...profile, clothingSize: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center font-medium">
                    {profile.clothingSize}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Naočare
                </label>
                <div
                  className={`p-3 rounded-lg text-center font-medium ${
                    profile.hasGlasses
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {profile.hasGlasses ? "✓ Nosi naočare" : "Ne nosi naočare"}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Zdravstvene informacije */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Zdravstvene informacije
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Krvna grupa */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Krvna grupa
                </label>
                {isEditing ? (
                  <select
                    value={profile.bloodType}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        bloodType: e.target.value as BloodType,
                      })
                    }
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    {bloodTypeOptions.map((type) => (
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
              </div>

              {/* Alergije */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Alergije
                </label>
                {isEditing ? (
                  <Input
                    value={profile.allergies.join(", ")}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        allergies: e.target.value
                          .split(",")
                          .map((a) => a.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Unesite alergije odvojene zarezima"
                  />
                ) : profile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        ⚠️ {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-600 italic">
                    Nema poznatih alergija
                  </div>
                )}
              </div>

              {/* Zdravstvene napomene */}
              {(isEditing || profile.healthNotes) && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Zdravstvene napomene
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profile.healthNotes}
                      onChange={(e) =>
                        setProfile({ ...profile, healthNotes: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                      placeholder="Važne napomene o zdravlju deteta"
                    />
                  ) : (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                      <p className="text-gray-800">{profile.healthNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lekovi */}
              {(isEditing || profile.medications.length > 0) && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Trenutna terapija
                  </label>
                  {isEditing ? (
                    <Input
                      value={profile.medications.join(", ")}
                      onChange={(e) => {
                        const medications = e.target.value
                          .split(",")
                          .map((m) => m.trim())
                          .filter(Boolean);
                        setProfile({
                          ...profile,
                          medications,
                        });
                      }}
                      placeholder="Lekovi odvojeni zarezima (npr. Aspirin, Paracetamol)"
                    />
                  ) : (
                    <div className="space-y-2">
                      {profile.medications.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                        >
                          {med}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vakcinacije */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                  <Syringe className="h-4 w-4" />
                  Vakcinacioni karton
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {profile.vaccinations.map((vac, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-900">
                          {vac.name}
                        </span>
                        {vac.booster && (
                          <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                            Revakcina
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        {new Date(vac.date).toLocaleDateString("sr-RS")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lekari i hitni kontakti */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-cyan-600" />
                Lekari i hitni kontakti
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {/* Primarni lekar */}
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-cyan-600" />
                  <div className="font-semibold text-cyan-900">
                    Primarni lekar
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <Input
                      value={profile.primaryDoctor}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          primaryDoctor: e.target.value,
                        })
                      }
                      placeholder="Ime i prezime lekara"
                    />
                    <Input
                      value={profile.primaryDoctorPhone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          primaryDoctorPhone: e.target.value,
                        })
                      }
                      placeholder="Telefon"
                      type="tel"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-gray-800 font-medium">
                      {profile.primaryDoctor}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-cyan-600" />
                      <a
                        href={`tel:${profile.primaryDoctorPhone}`}
                        className="text-cyan-700 hover:underline"
                      >
                        {profile.primaryDoctorPhone}
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Stomatolog */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="font-semibold text-blue-900">Stomatolog</div>
                </div>
                {isEditing ? (
                  <>
                    <Input
                      value={profile.dentist}
                      onChange={(e) =>
                        setProfile({ ...profile, dentist: e.target.value })
                      }
                      placeholder="Ime i prezime stomatologa"
                    />
                    <Input
                      value={profile.dentistPhone}
                      onChange={(e) =>
                        setProfile({ ...profile, dentistPhone: e.target.value })
                      }
                      placeholder="Telefon"
                      type="tel"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-gray-800 font-medium">
                      {profile.dentist}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <a
                        href={`tel:${profile.dentistPhone}`}
                        className="text-blue-700 hover:underline"
                      >
                        {profile.dentistPhone}
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Hitni kontakt 1 */}
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="font-semibold text-red-900">
                    Hitni kontakt 1
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <Input
                      value={profile.emergencyContact1}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContact1: e.target.value,
                        })
                      }
                      placeholder="Ime i veza (npr. Ana Marković - majka)"
                    />
                    <Input
                      value={profile.emergencyContact1Phone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContact1Phone: e.target.value,
                        })
                      }
                      placeholder="Telefon"
                      type="tel"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-gray-800 font-medium">
                      {profile.emergencyContact1}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-red-600" />
                      <a
                        href={`tel:${profile.emergencyContact1Phone}`}
                        className="text-red-700 hover:underline font-medium"
                      >
                        {profile.emergencyContact1Phone}
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Hitni kontakt 2 */}
              <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="font-semibold text-orange-900">
                    Hitni kontakt 2
                  </div>
                </div>
                {isEditing ? (
                  <>
                    <Input
                      value={profile.emergencyContact2}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContact2: e.target.value,
                        })
                      }
                      placeholder="Ime i veza (npr. Petar Marković - otac)"
                    />
                    <Input
                      value={profile.emergencyContact2Phone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContact2Phone: e.target.value,
                        })
                      }
                      placeholder="Telefon"
                      type="tel"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-gray-800 font-medium">
                      {profile.emergencyContact2}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-orange-600" />
                      <a
                        href={`tel:${profile.emergencyContact2Phone}`}
                        className="text-orange-700 hover:underline font-medium"
                      >
                        {profile.emergencyContact2Phone}
                      </a>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Aktivnosti i interesovanja */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Aktivnosti i interesovanja
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  🎨 Hobiji
                </label>
                {isEditing ? (
                  <Input
                    value={profile.hobbies}
                    onChange={(e) =>
                      setProfile({ ...profile, hobbies: e.target.value })
                    }
                    placeholder="Šta dete voli da radi u slobodno vreme?"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {profile.hobbies}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  ⚽ Sportovi
                </label>
                {isEditing ? (
                  <Input
                    value={profile.sports}
                    onChange={(e) =>
                      setProfile({ ...profile, sports: e.target.value })
                    }
                    placeholder="Koje sportove dete trenira?"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {profile.sports}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  🎭 Vannastavne aktivnosti
                </label>
                {isEditing ? (
                  <Input
                    value={profile.activities}
                    onChange={(e) =>
                      setProfile({ ...profile, activities: e.target.value })
                    }
                    placeholder="Sekcije i aktivnosti u školi"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {profile.activities}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Bottom notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500 py-4"
      >
        <p>
          Poslednja izmena:{" "}
          <span className="font-medium">
            {new Date().toLocaleDateString("sr-RS")}
          </span>
        </p>
      </motion.div>
    </div>
  );
}
