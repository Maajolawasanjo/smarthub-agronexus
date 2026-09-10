export interface LocaleMetadata {
  code: string;
  name: string;
  nativeName: string;
}

export const LOCALES: LocaleMetadata[] = [
  { code: "en-NG", name: "English (Nigeria)", nativeName: "English (Nigeria)" },
  { code: "en-US", name: "English (United States)", nativeName: "English (US)" },
  { code: "en-GB", name: "English (United Kingdom)", nativeName: "English (UK)" },
  { code: "fr-FR", name: "French (France)", nativeName: "Français" },
  { code: "de-DE", name: "German (Germany)", nativeName: "Deutsch" },
  { code: "ar-AE", name: "Arabic (UAE)", nativeName: "العربية" },
  { code: "ja-JP", name: "Japanese (Japan)", nativeName: "日本語" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português" },
  { code: "es-ES", name: "Spanish (Spain)", nativeName: "Español" },
  { code: "sw-KE", name: "Swahili (Kenya)", nativeName: "Kiswahili" },
  { code: "ha-NG", name: "Hausa (Nigeria)", nativeName: "Hausa" },
  { code: "yo-NG", name: "Yoruba (Nigeria)", nativeName: "Yorùbá" },
  { code: "ig-NG", name: "Igbo (Nigeria)", nativeName: "Igbo" },
];

export function getLocaleMetadata(code: string): LocaleMetadata {
  return (
    LOCALES.find((l) => l.code === code) || {
      code: code || "en-NG",
      name: code || "English (Nigeria)",
      nativeName: code || "English",
    }
  );
}
