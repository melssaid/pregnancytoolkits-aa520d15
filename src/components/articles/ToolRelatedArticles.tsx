import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { articleUiCopy, getArticlesForTool } from "@/data/articles";
import { resolveArticleLocale } from "@/lib/articleLocale";

interface ToolRelatedArticlesProps {
  toolId: string;
  maxItems?: number;
}

/**
 * Compact, elegant "related articles" rail rendered inside tool pages,
 * just before the footer. Each item shows a small thumbnail, type badge,
 * title and read time — matching the warm rose/lavender system.
 */
export function ToolRelatedArticles({ toolId, maxItems = 3 }: ToolRelatedArticlesProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const locale = resolveArticleLocale(lang);
  const copy = articleUiCopy(lang);
  const articles = useMemo(
    () => getArticlesForTool(toolId, lang, maxItems),
    [toolId, lang, maxItems],
  );

  if (!articles.length) return null;

  const ArrowIcon = locale.isRTL ? ArrowLeft : ArrowRight;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      dir={locale.dir}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-[var(--shadow-card)]"
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40" />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
              {copy.discoverMore}
            </p>
            <h3 className={`text-[14px] font-black text-foreground leading-tight ${locale.headingClass}`}>
              {copy.relatedArticles}
            </h3>
          </div>
        </div>
      </div>

      {/* Articles list */}
      <ul className="divide-y divide-border/40">
        {articles.map((article, index) => (
          <li key={article.slug}>
            <Link
              to={`/articles/${article.slug}`}
              className="group flex items-center gap-3 px-4 py-3 transition-colors duration-300 hover:bg-secondary/40 active:bg-secondary/60"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                <img
                  src={article.image}
                  alt={article.heroAlt}
                  loading="lazy"
                  width={128}
                  height={128}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary/10 to-accent/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/15">
                    {article.typeLabel}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {article.readTimeLabel}
                  </span>
                </div>
                <h4 className={`line-clamp-2 text-[12.5px] font-bold leading-snug text-foreground ${locale.headingClass}`}>
                  {article.title}
                </h4>
              </div>

              {/* Arrow */}
              <ArrowIcon className="w-4 h-4 flex-shrink-0 text-primary/70 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

export default ToolRelatedArticles;
