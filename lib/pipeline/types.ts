// What the pipeline server sends back. Shared by the admin panel's client components.

export type PipelineRun = {
  id: number;
  pipeline: string;
  trigger: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  requests: number;
  documentsChanged: number;
  documentsUnchanged: number;
  recordsWritten: number;
  error: string | null;
};

export type PipelineInfo = {
  name: string;
  description: string;
  schedule: string | null;
  dependsOn: string[];
  lastRun: PipelineRun | null;
  lastSuccessAt: string | null;
  runs30d: number;
  successes30d: number;
  failures30d: number;
  requests30d: number;
  records30d: number;
  avgSeconds: number | null;
};

export type PipelineJob = {
  id: string;
  names: string[];
  actor: string;
  trigger: string;
  limit: number | null;
  max_requests: number | null;
  queued_at: string | null;
  started_at: string | null;
  results: Record<string, string> | null;
  error: string | null;
};

export type ServerStatus = {
  busy: boolean;
  stopping: boolean;
  current: PipelineJob | null;
  queue: PipelineJob[];
  last: PipelineJob | null;
  uptimeSeconds: number;
  scheduleEnabled: boolean;
  lastDailyRun: string | null;
  dailyHour: number;
  serverTime: string;
};

export type DailyMetric = { day: string; runs: number; failures: number; requests: number; records: number; changed: number };

export type PipelineMetrics = {
  daily: DailyMetric[];
  sources: { source: string; documents: number; bytes: number; lastFetchedAt: string | null }[];
  tables: Record<string, number | null>;
  quality: {
    open: Record<string, number>;
    byCheck: { check: string; severity: string; count: number }[];
  };
};

export type RunLogLine = { id: number; at: string | null; level: string; message: string };

export type QualityIssue = {
  id: number;
  check: string;
  severity: string;
  entity: string;
  message: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
};
