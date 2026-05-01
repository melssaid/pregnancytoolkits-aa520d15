import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Globe, RefreshCw, Smartphone, Users, Eye, TimerReset, Download, Bell, TrendingUp } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { getBackendFunctionUrl } from "@/lib/backendConfig";
import { ensureAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Line, LineChart, Legend } from "recharts";

type SegmentKey = "combined" | "app" | "web";

interface SegmentStats {
  totalEvents: number;
  totalViews: number;
  pageViews: number;
  toolViews: number;
  uniqueSessions: number;
  sessionStarts: number;
  liveSessions: number;
  avgDurationSeconds: number | null;
  topPages: { tool_id: string; path: string; views: number }[];
  hourly: { hour: string; views: number; sessions: number }[];
  languages: { lang: string; count: number }[];
}

interface UsageResponse {
  generatedAt: string;
  rangeHours: number;
  liveWindowMinutes: number;
  dailyDays: number;
  combined: SegmentStats;
  app: SegmentStats;
  web: SegmentStats;
  daily: { date: string; dau: number; pageViews: number; pwaInstalls: number; appOpens: number }[];
  dailyTotals: { dau: number; pageViews: number; pwaInstalls: number; appOpens: number };
  pushSubscriptions: { total: number; byLanguage: { lang: string; count: number }[] };
  countriesLast24h: { country: string; sessions: number; langs: string[] }[];
  sessionDebug: {
    sessionId: string;
    bucket: Exclude<SegmentKey, "combined">;
    reason: string;
    matchedRules: string[];
    matchedActionType: string;
    matchedAt: string;
    firstSeen: string;
    lastSeen: string;
    events: number;
    inspected: {
      platform: string;
      host: string;
      userAgent: string;
      source: string;
      runtime: string;
    };
  }[];
}

const segmentMeta: Record<SegmentKey, { label: string; icon: typeof Activity }> = {
  combined: { label: "الإجمالي", icon: Activity },
  app: { label: "التطبيق", icon: Smartphone },
  web: { label: "الويب", icon: Globe },
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds} ث`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}د ${remainder}ث` : `${minutes}د`;
}

export default function AdminUsageDashboard() {
  const [stats, setStats] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segment, setSegment] = useState<SegmentKey>("combined");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await ensureAuthenticated();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("تعذر إنشاء جلسة للوصول إلى التقرير.");
      }

      const res = await fetch(`${getBackendFunctionUrl("app-usage-stats")}?hours=48&liveMinutes=5&days=7`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل التقرير.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const activeStats = useMemo(() => stats?.[segment] ?? null, [segment, stats]);
  const debugSessions = useMemo(() => {
    if (!stats) return [];
    if (segment === "combined") return stats.sessionDebug;
    return stats.sessionDebug.filter((item) => item.bucket === segment);
  }, [segment, stats]);
  const segmentCards = useMemo(() => {
    if (!stats) return [];
    return (["combined", "app", "web"] as SegmentKey[]).map((key) => ({
      key,
      label: segmentMeta[key].label,
      views: stats[key].totalViews,
      sessions: stats[key].uniqueSessions,
      live: stats[key].liveSessions,
    }));
  }, [stats]);

  return (
    <Layout showBack>
      <SEOHead title="تقرير الزيارات الحية" description="لوحة شاملة للمشاهدات والجلسات الحية مع فصل التطبيق عن الويب" noindex />
      <div className="container max-w-5xl space-y-5 pb-24 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[1.35rem] font-black text-foreground ar-heading">تقرير الزيارات الحية</h1>
            <p className="mt-1 text-sm text-muted-foreground">المشاهدات والجلسات الفعلية خلال آخر 48 ساعة مع فصل التطبيق عن الويب.</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {segmentCards.map((item) => {
                const Icon = segmentMeta[item.key].icon;
                const active = segment === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSegment(item.key)}
                    className={`rounded-2xl border px-4 py-4 text-start transition-colors ${active ? "border-primary bg-secondary" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </div>
                    <div className="mt-3 text-[1.5rem] font-black text-foreground">{item.views}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.sessions} جلسة • {item.live} حي الآن</div>
                  </button>
                );
              })}
            </div>

            {activeStats && (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard icon={<Eye className="h-4 w-4" />} label="المشاهدات" value={activeStats.totalViews} sub={`${activeStats.pageViews} صفحات`} />
                  <StatCard icon={<Users className="h-4 w-4" />} label="الجلسات" value={activeStats.uniqueSessions} sub={`${activeStats.sessionStarts} بداية جلسة`} />
                  <StatCard icon={<Activity className="h-4 w-4" />} label="الحي الآن" value={activeStats.liveSessions} sub={`آخر ${stats.liveWindowMinutes} دقائق`} />
                  <StatCard icon={<TimerReset className="h-4 w-4" />} label="متوسط الجلسة" value={formatDuration(activeStats.avgDurationSeconds)} sub="تقريبي" />
                </div>

                <Tabs defaultValue="daily" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 text-[11px]">
                    <TabsTrigger value="daily">اليومي</TabsTrigger>
                    <TabsTrigger value="chart">النشاط</TabsTrigger>
                    <TabsTrigger value="pages">الصفحات</TabsTrigger>
                    <TabsTrigger value="langs">اللغات</TabsTrigger>
                    <TabsTrigger value="debug">Debug</TabsTrigger>
                  </TabsList>

                  <TabsContent value="daily" className="space-y-3">
                    {(() => {
                      const today = stats.daily[stats.daily.length - 1];
                      const yesterday = stats.daily[stats.daily.length - 2];
                      const last7 = stats.daily.slice(-7);
                      const weekDau = last7.reduce((s, d) => s + d.dau, 0);
                      const weekViews = last7.reduce((s, d) => s + d.pageViews, 0);
                      const trend = today && yesterday && yesterday.dau > 0
                        ? Math.round(((today.dau - yesterday.dau) / yesterday.dau) * 100)
                        : null;
                      return (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <StatCard
                            icon={<Users className="h-4 w-4" />}
                            label="زوار اليوم"
                            value={today?.dau ?? 0}
                            sub={trend !== null ? `${trend >= 0 ? "+" : ""}${trend}% عن الأمس` : "بداية اليوم"}
                          />
                          <StatCard icon={<Eye className="h-4 w-4" />} label="مشاهدات اليوم" value={today?.pageViews ?? 0} sub={`${today?.appOpens ?? 0} فتحات`} />
                          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="زوار الأسبوع" value={weekDau} sub={`${weekViews} مشاهدة`} />
                          <StatCard icon={<Bell className="h-4 w-4" />} label="مشتركو الإشعارات" value={stats.pushSubscriptions.total} sub="إجمالي" />
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <StatCard icon={<TrendingUp className="h-4 w-4" />} label={`زوار ${stats.dailyDays} أيام`} value={stats.dailyTotals.dau} sub="DAU مجموع" />
                      <StatCard icon={<Eye className="h-4 w-4" />} label="مشاهدات الصفحات" value={stats.dailyTotals.pageViews} sub="آخر أسبوع" />
                      <StatCard icon={<Download className="h-4 w-4" />} label="تثبيتات PWA" value={stats.dailyTotals.pwaInstalls} sub="مجموع الأسبوع" />
                      <StatCard icon={<Activity className="h-4 w-4" />} label="فتحات التطبيق" value={stats.dailyTotals.appOpens} sub="مجموع الأسبوع" />
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">الزوار اليوميون (DAU) — آخر {stats.dailyDays} أيام</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={stats.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="dau" name="زوار" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="appOpens" name="فتحات" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2 }} />
                            <Line type="monotone" dataKey="pwaInstalls" name="تثبيتات" stroke="hsl(140 60% 45%)" strokeWidth={2} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">مشتركو الإشعارات حسب اللغة</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {stats.pushSubscriptions.byLanguage.length === 0 ? (
                          <div className="text-xs text-muted-foreground">لا توجد اشتراكات إشعارات بعد.</div>
                        ) : (
                          stats.pushSubscriptions.byLanguage.map((item) => (
                            <div key={item.lang} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                              <span className="text-xs font-semibold text-foreground">{item.lang}</span>
                              <span className="text-sm font-black text-primary">{item.count}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">تفصيل يومي</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>التاريخ</TableHead>
                              <TableHead className="text-right">زوار</TableHead>
                              <TableHead className="text-right">فتحات</TableHead>
                              <TableHead className="text-right">PWA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...stats.daily].reverse().map((d) => (
                              <TableRow key={d.date}>
                                <TableCell className="text-xs font-medium text-foreground">{d.date}</TableCell>
                                <TableCell className="text-right text-xs font-bold text-primary">{d.dau}</TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{d.appOpens}</TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{d.pwaInstalls}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="chart">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">المشاهدات والجلسات حسب الساعة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={activeStats.hourly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(11)} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="views" name="المشاهدات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="sessions" name="الجلسات" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="pages">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">أكثر الصفحات زيارة</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الصفحة</TableHead>
                              <TableHead className="text-right">المشاهدات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeStats.topPages.map((page) => (
                              <TableRow key={`${segment}-${page.tool_id}`}>
                                <TableCell className="text-xs font-medium text-foreground">{page.path}</TableCell>
                                <TableCell className="text-right text-xs font-bold text-primary">{page.views}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="langs">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">اللغات النشطة</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {activeStats.languages.map((item) => (
                          <div key={`${segment}-${item.lang}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3">
                            <span className="text-sm font-semibold text-foreground">{item.lang}</span>
                            <span className="text-sm font-black text-primary">{item.count}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="debug">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-foreground">Debug تصنيف الجلسات</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-muted-foreground">
                          يعرض سبب تصنيف كل جلسة كـ app أو web مع القيم الفعلية القادمة من metadata.
                        </div>
                        <div className="space-y-3">
                          {debugSessions.length === 0 ? (
                            <div className="rounded-xl border border-border bg-card px-3 py-4 text-xs text-muted-foreground">
                              لا توجد جلسات مطابقة لهذا القسم في آخر {stats.rangeHours} ساعة.
                            </div>
                          ) : (
                            debugSessions.map((item) => (
                              <div key={item.sessionId} className="rounded-2xl border border-border bg-card px-3 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-sm font-bold text-foreground">{item.bucket === "app" ? "App" : "Web"}</div>
                                  <div className="text-[11px] text-muted-foreground">{item.events} events • {item.matchedActionType}</div>
                                </div>
                                <div className="mt-2 break-all text-[11px] text-muted-foreground">{item.sessionId}</div>
                                <div className="mt-2 text-xs font-medium text-foreground">{item.reason}</div>
                                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                  <DebugField label="platform" value={item.inspected.platform} />
                                  <DebugField label="host" value={item.inspected.host} />
                                  <DebugField label="userAgent" value={item.inspected.userAgent} />
                                  <DebugField label="source" value={item.inspected.source} />
                                  <DebugField label="runtime" value={item.inspected.runtime} />
                                  <DebugField label="matchedAt" value={new Date(item.matchedAt).toLocaleString()} />
                                </div>
                                {!!item.matchedRules.length && (
                                  <div className="mt-3 text-[11px] text-primary">Regex: {item.matchedRules.join(" • ")}</div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-xs text-muted-foreground">
                    <span>آخر تحديث: {new Date(stats.generatedAt).toLocaleString()}</span>
                    <span>المدى: {stats.rangeHours} ساعة</span>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {loading && <div className="py-10 text-center text-sm text-muted-foreground">جاري تحميل التقرير...</div>}
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </div>
        <div className="mt-3 text-[1.45rem] font-black text-foreground">{value}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function DebugField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-[11px] text-foreground">{value || "—"}</div>
    </div>
  );
}