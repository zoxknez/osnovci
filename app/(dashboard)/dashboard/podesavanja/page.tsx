// Podešavanja - Ultra-Modern Settings Page with Instant Feedback
"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Camera,
  Fingerprint,
  Key,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Phone,
  Save,
  School,
  Shield,
  Smartphone,
  Sun,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations/variants";

export default function PodjesavanjaPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [language, setLanguage] = useState<"sr" | "en">("sr");
  const [notifications, setNotifications] = useState({
    grades: true,
    homework: true,
    schedule: false,
    messages: true,
  });
  const [profileData, setProfileData] = useState({
    name: "Marko Marković",
    email: "ucenik@demo.rs",
    phone: "064 123 4567",
    school: 'OŠ "Vuk Karadžić"',
    class: "5B",
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Auto-save helpers
  const autoSave = async (
    setting: string,
    value: string | boolean | object,
  ) => {
    // TODO: Save to backend API
    console.log(`💾 Auto-saving: ${setting} = ${JSON.stringify(value)}`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  // Handle theme change with instant save
  const handleThemeChange = async (newTheme: "light" | "dark" | "auto") => {
    setTheme(newTheme);

    // Save instantly
    await autoSave("theme", newTheme);

    // Show success toast
    const themeNames = { light: "Svetla", dark: "Tamna", auto: "Auto" };
    toast.success(`✨ Tema promenjena`, {
      description: `Tema postavljena na: ${themeNames[newTheme]}`,
      duration: 2000,
    });
  };

  // Handle language change with instant save
  const handleLanguageChange = async (newLang: "sr" | "en") => {
    setLanguage(newLang);

    // Save instantly
    await autoSave("language", newLang);

    // Show success toast
    toast.success(`🌍 Jezik sačuvan`, {
      description: `Jezik postavljen na: ${newLang === "sr" ? "Srpski" : "English"}`,
      duration: 2000,
    });
  };

  // Handle notification toggle with instant save
  const handleNotificationToggle = async (key: string) => {
    const newValue = !notifications[key as keyof typeof notifications];
    const newNotifications = {
      ...notifications,
      [key]: newValue,
    };

    setNotifications(newNotifications);

    // Save instantly
    await autoSave("notifications", newNotifications);

    // Show success toast
    const labels: Record<string, string> = {
      grades: "Nove ocene",
      homework: "Novi domaći",
      schedule: "Promene rasporeda",
      messages: "Poruke",
    };

    toast.success(`🔔 ${newValue ? "Uključeno" : "Isključeno"}`, {
      description: labels[key],
      duration: 2000,
    });
  };

  // Handle profile field change
  const handleProfileChange = async (field: string, value: string) => {
    const newProfile = { ...profileData, [field]: value };
    setProfileData(newProfile);

    // Auto-save with debounce
    await autoSave(`profile.${field}`, value);

    toast.success("✅ Sačuvano", {
      description: "Podaci ažurirani",
      duration: 1500,
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    // Simulate file upload
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);

    toast.success("📸 Slika promenjena!", {
      description: "Avatar je uspešno ažuriran",
      duration: 2000,
    });
  };

  // Handle biometric toggle
  const handleBiometricToggle = async () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);

    await autoSave("biometric", newValue);

    toast.success(newValue ? "✅ Aktivirano" : "❌ Deaktivirano", {
      description: `Biometrijska autentifikacija ${newValue ? "uključena" : "isključena"}`,
      duration: 2000,
    });
  };

  // Handle 2FA toggle
  const handleTwoFactorToggle = async () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);

    await autoSave("twoFactor", newValue);

    toast.success(newValue ? "✅ Aktivirano" : "❌ Deaktivirano", {
      description: `Dvostruka verifikacija ${newValue ? "uključena" : "isključena"}`,
      duration: 2000,
    });
  };

  // Handle password change
  const handlePasswordChange = () => {
    toast.info("🔐 Otvaranje forme...", {
      description: "Unesi trenutnu i novu lozinku",
      duration: 2000,
    });
    // TODO: Open password change modal
  };

  const handleLogout = () => {
    toast.success("👋 Odjavio si se!", {
      description: "Vidimo se uskoro!",
      duration: 2000,
    });
    // TODO: Implement real logout
    setTimeout(() => {
      window.location.href = "/prijava";
    }, 1500);
  };

  // Apply theme instantly
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial="initial" animate="animate" variants={fadeInUp}>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          ⚙️ Podešavanja
        </h1>
        <p className="text-gray-600 mt-1">
          Prilagodi aplikaciju po svojoj želji
        </p>
      </motion.div>

      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Profile Settings */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar - Interactive */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    M
                  </motion.div>
                  <motion.button
                    onClick={handleAvatarUpload}
                    disabled={isSaving}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {isSaving ? (
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
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      Promeni
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {profileData.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Učenik, {profileData.class}
                  </p>
                  <motion.button
                    onClick={handleAvatarUpload}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-2 px-4 py-1.5 text-sm border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all touch-manipulation"
                  >
                    {isSaving ? "Uploading..." : "Promeni sliku"}
                  </motion.button>
                </div>
              </div>

              {/* Form Fields - Auto-save on blur */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Email
                    <span className="text-xs text-gray-500">(auto-save)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Telefon
                    <span className="text-xs text-gray-500">(auto-save)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Škola
                    <span className="text-xs text-gray-500">(auto-save)</span>
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={profileData.school}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          school: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleProfileChange("school", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Razred
                    <span className="text-xs text-gray-500">(auto-save)</span>
                  </label>
                  <Input
                    value={profileData.class}
                    onChange={(e) =>
                      setProfileData({ ...profileData, class: e.target.value })
                    }
                    onBlur={(e) => handleProfileChange("class", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Izgled
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Tema
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "light" as const, icon: Sun, label: "Svetla" },
                    { value: "dark" as const, icon: Moon, label: "Tamna" },
                    { value: "auto" as const, icon: Smartphone, label: "Auto" },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        p-4 rounded-lg border-2 transition-all relative
                        ${
                          theme === option.value
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }
                      `}
                    >
                      {theme === option.value && (
                        <motion.div
                          layoutId="theme-indicator"
                          className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        >
                          <span className="text-white text-xs">✓</span>
                        </motion.div>
                      )}
                      <option.icon
                        className={`h-6 w-6 mx-auto mb-2 transition-colors ${
                          theme === option.value
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      />
                      <div
                        className={`text-sm font-medium transition-colors ${
                          theme === option.value
                            ? "text-blue-600"
                            : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Jezik
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "sr" as const, label: "Srpski", flag: "🇷🇸" },
                    { value: "en" as const, label: "English", flag: "🇬🇧" },
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => handleLanguageChange(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        p-4 rounded-lg border-2 transition-all flex items-center gap-3 relative
                        ${
                          language === option.value
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }
                      `}
                    >
                      {language === option.value && (
                        <motion.div
                          layoutId="language-indicator"
                          className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        >
                          <span className="text-white text-xs">✓</span>
                        </motion.div>
                      )}
                      <span className="text-2xl">{option.flag}</span>
                      <span
                        className={`font-medium transition-colors ${
                          language === option.value
                            ? "text-blue-600"
                            : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikacije
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "grades", label: "Nove ocene", icon: "📊" },
                { key: "homework", label: "Novi domaći zadaci", icon: "📚" },
                { key: "schedule", label: "Promene rasporeda", icon: "📅" },
                { key: "messages", label: "Poruke", icon: "💬" },
              ].map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-gray-900">
                      {option.label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(option.key)}
                    aria-label={`${notifications[option.key as keyof typeof notifications] ? "Isključi" : "Uključi"} notifikacije za ${option.label}`}
                    className={`
                      relative w-14 h-8 rounded-full transition-all duration-200
                      ${
                        notifications[option.key as keyof typeof notifications]
                          ? "bg-blue-500 shadow-md"
                          : "bg-gray-300"
                      }
                      hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                    `}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                      animate={{
                        x: notifications[
                          option.key as keyof typeof notifications
                        ]
                          ? 24
                          : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                    <span className="sr-only">
                      {notifications[option.key as keyof typeof notifications]
                        ? "Uključeno"
                        : "Isključeno"}
                    </span>
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security - Interactive toggles */}
        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sigurnost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Password Button */}
              <motion.button
                onClick={handlePasswordChange}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border-2 border-gray-200 hover:border-blue-300 touch-manipulation"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      Promeni lozinku
                    </div>
                    <div className="text-xs text-gray-600">
                      Poslednja promena: Pre 30 dana
                    </div>
                  </div>
                </div>
                <Key className="h-5 w-5 text-gray-400" />
              </motion.button>

              {/* Biometric Authentication Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      biometricEnabled ? "bg-green-100" : "bg-gray-200"
                    }`}
                  >
                    <Fingerprint
                      className={`h-5 w-5 transition-colors ${
                        biometricEnabled ? "text-green-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Biometrija
                    </div>
                    <div className="text-xs text-gray-600">
                      {biometricEnabled ? "Aktivan otisak prsta" : "Neaktivno"}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={handleBiometricToggle}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative w-14 h-8 rounded-full transition-all duration-200
                    ${biometricEnabled ? "bg-green-500 shadow-md" : "bg-gray-300"}
                    hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                    touch-manipulation
                  `}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                    animate={{ x: biometricEnabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              {/* Two-Factor Authentication Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      twoFactorEnabled ? "bg-purple-100" : "bg-gray-200"
                    }`}
                  >
                    <Shield
                      className={`h-5 w-5 transition-colors ${
                        twoFactorEnabled ? "text-purple-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      2FA Verifikacija
                    </div>
                    <div className="text-xs text-gray-600">
                      {twoFactorEnabled
                        ? "Dodatna zaštita aktivna"
                        : "Neaktivno"}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={handleTwoFactorToggle}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative w-14 h-8 rounded-full transition-all duration-200
                    ${twoFactorEnabled ? "bg-purple-500 shadow-md" : "bg-gray-300"}
                    hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                    touch-manipulation
                  `}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                    animate={{ x: twoFactorEnabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div variants={staggerItem} className="flex gap-4">
          <div className="flex-1 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Save className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-green-900">
                Auto-save aktiviran
              </div>
              <div className="text-sm text-green-700">
                Sve promene se automatski čuvaju
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label="Odjavi se sa naloga"
          >
            <LogOut className="h-4 w-4" />
            Odjavi se
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div variants={staggerItem}>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <div className="text-4xl mb-2">📱</div>
                <div className="font-semibold text-gray-900">Osnovci App</div>
                <div className="text-sm text-gray-600">Verzija 1.0.0</div>
                <div className="text-xs text-gray-500 mt-4">
                  © 2025 Osnovci. Sva prava zadržana.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
