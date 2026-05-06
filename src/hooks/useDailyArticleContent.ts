import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyArticleContentRecord {
  slug: string;
  language: string;
  title_override: string | null;
  excerpt_override: string | null;
  intro_override: string | null;
  markdown_body: string;
  seo_description: string | null;
  reading_minutes: number | null;
  effective_date: string;
}

export const splitMarkdownIntoSections = (markdown: string) => {
  const normalized = markdown.replace(/\r/g, "").trim();
  if (!normalized) return [] as { heading: string; body: string }[];

  const blocks = normalized.split(/^##\s+/m);
  const sections: { heading: string; body: string }[] = [];

  const intro = blocks.shift()?.trim();
  if (intro) sections.push({ heading: "", body: intro });

  blocks.forEach((block) => {
    const [headingLine, ...rest] = block.split("\n");
    const heading = headingLine?.trim() ?? "";
    const body = rest.join("\n").trim();
    if (heading || body) sections.push({ heading, body });
  });

  return sections;
};

/**
 * Daily AI-generated article overrides are DISABLED.
 *
 * The product now uses a fixed catalog of curated articles per language
 * (see `src/data/articles.ts`) rotated on the UI every 2 days. We no longer
 * fetch `article_daily_content` from the backend, so consumers receive
 * `null` data and an empty `sections` list and naturally fall back to the
 * static localized article body.
 */
export function useDailyArticleContent(_slug: string, _language: string) {
  const query = useQuery({
    queryKey: ["daily-article-content", "disabled"],
    enabled: false,
    queryFn: async () => null as DailyArticleContentRecord | null,
  });

  return {
    ...query,
    data: null as DailyArticleContentRecord | null,
    sections: [] as { heading: string; body: string }[],
  };
}