import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { languageConfig, resolveLanguage, supportedLanguages } from "@/lib/i18n/config"
import { getLanguage } from "@/lib/i18n/i18n"

export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation()
  const language = getLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 shrink-0 px-3 sm:h-9"
          aria-label={t("language.change")}
        >
          <Languages aria-hidden="true" />
          <span className="hidden sm:inline" lang={language}>
            {languageConfig[language].label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => {
            const nextLanguage = resolveLanguage(value)
            if (nextLanguage) void i18n.changeLanguage(nextLanguage)
          }}
        >
          {supportedLanguages.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {languageConfig[code].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
