import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useI18n } from "../../../i18n";

const GITHUB_URL = "https://github.com/Dimillian/CodexMonitor";
const TWITTER_URL = "https://x.com/dimillian";

export function AboutView() {
  const [version, setVersion] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    let active = true;
    getVersion()
      .then((value) => {
        if (active) {
          setVersion(value);
        }
      })
      .catch(() => {
        if (active) {
          setVersion(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="about">
      <div className="about-card">
        <div className="about-header">
          <img
            className="about-icon"
            src="/app-icon.png"
            alt={t("about.icon_alt")}
          />
          <div className="about-title">{t("about.title")}</div>
        </div>
        <div className="about-version">
          {version ? t("about.version", { version }) : t("about.version_unknown")}
        </div>
        <div className="about-tagline">
          {t("about.tagline")}
        </div>
        <div className="about-divider" />
        <div className="about-links">
          <button
            type="button"
            className="about-link"
            onClick={() => openUrl(GITHUB_URL)}
          >
            {t("about.github")}
          </button>
          <span className="about-link-sep">|</span>
          <button
            type="button"
            className="about-link"
            onClick={() => openUrl(TWITTER_URL)}
          >
            {t("about.twitter")}
          </button>
        </div>
        <div className="about-footer">{t("about.made_by")}</div>
      </div>
    </div>
  );
}
