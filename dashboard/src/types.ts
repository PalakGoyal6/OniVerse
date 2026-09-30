export interface ReportSummary {
  id: number;
  report_id: string;
  lot_id: string;
  centre_name: string;
  inspector_name: string;
  farmer_name: string;
  farmer_phone: string;
  variety: string;
  sample_weight_kg?: number;
  total_lot_weight_kg?: number;
  total_onions_count: number;
  grade_a_pct: number;
  urs_pct: number;
  rejected_pct: number;
  average_diameter_mm: number;
  lot_verdict: string;
  report_hash: string;
  has_overrides: boolean;
  is_disputed: boolean;
  created_at: string;
}

export interface StatsOverview {
  total_lots_today: number;
  total_lots_week: number;
  total_weight_kg_graded: number;
  average_grade_a_pct: number;
  average_urs_pct: number;
  average_rejected_pct: number;
  open_disputes_count: number;
  active_centres_count: number;
  total_inspectors_active: number;
}

export interface CentreComparison {
  centre_name: string;
  district: string;
  lat: number;
  lng: number;
  lots_count: number;
  avg_grade_a_pct: number;
  avg_urs_pct: number;
  override_rate_pct: number;
  anomaly_flag: 'NORMAL' | 'ALERT_LOW_GRADE' | 'ALERT_HIGH_GRADE';
  anomaly_reason?: string;
}

export interface InspectorConsistency {
  inspector_id: number;
  name: string;
  centre: string;
  total_lots_scanned: number;
  override_count: number;
  override_rate_pct: number;
  direction_lowered_pct: number;
  direction_boosted_pct: number;
  flag: 'CONSISTENT' | 'FLAGGED_DOWNGRADING' | 'FLAGGED_UPGRADING';
  flag_reason: string;
}

export interface DisputeItem {
  id: number;
  report_id: string;
  farmer_phone: string;
  farmer_name: string;
  centre_name: string;
  reason: string;
  status: string;
  supervisor_notes?: string;
  re_scan_report_id?: string;
  created_at: string;
  resolved_at?: string;
  original_grade_a_pct: number;
  original_urs_pct: number;
}

export interface AuditChainStatus {
  status: string;
  total_entries: number;
  chain_intact: boolean;
  broken_at_sequence?: number;
  latest_block_hash?: string;
  message: string;
}
