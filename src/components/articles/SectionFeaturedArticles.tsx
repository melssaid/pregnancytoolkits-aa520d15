
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { articleUiCopy, getCurrentRotationSeed, getFeaturedSectionBundle, type ArticleSectionKey } from "@/data/articles";
import { ArticleFeatureCard, ArticleTitleLink } from "@/components/articles/ArticleCards";

export function SectionFeaturedArticles({ sectionKey }: { sectionKey: ArticleSectionKey }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const isRTL = lang === "ar";
  const copy = articleUiCopy(lang);
  const rotationSeed = getCurrentRotationSeed();
  const bundle = useMemo(() => getFeaturedSectionBundle(sectionKey, lang), [lang, sectionKey, rotationSeed]);

  if (!bundle.main) return null;

  return (
    <div className="mt-3 px-0.5">
      <div className="space-y-2.5">
        <ArticleFeatureCard article={bundle.main} isRTL={isRTL} label={copy.featuredLabel} hideLabel />
        <div className="space-y-2">
          {bundle.secondary.map((article, index) => (
            <ArticleTitleLink
              key={article.slug}
              article={article}
              isRTL={isRTL}
              label={index === 0 ? copy.readAlso : copy.suggested}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
