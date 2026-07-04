export type IntakeRelation =
  | "before_food"
  | "after_food"
  | "with_food"
  | "any";

export type MedicationLogStatus = "pending" | "taken" | "skipped";

export type GlucoseMeasurementType =
  | "fasting"
  | "after_meal"
  | "bedtime"
  | "other";

export interface Profile {
  id: string;
  email: string;
  login: string | null;
  display_name: string | null;
  start_weight: number | null;
  pregnancy_week: number | null;
  tracking_start_date: string | null;
  last_menstrual_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  glucose_fasting_limit: number;
  glucose_after_meal_limit: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  icon: string;
  intake_relation: IntakeRelation;
  times_per_day: number;
  schedule_times: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_id: string;
  scheduled_for: string;
  taken_at: string | null;
  status: MedicationLogStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlucoseLog {
  id: string;
  user_id: string;
  measured_at: string;
  value: number;
  measurement_type: GlucoseMeasurementType;
  meal_text: string | null;
  minutes_after_meal: number | null;
  note: string | null;
  is_high: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  measured_at: string;
  weight: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BloodPressureLog {
  id: string;
  user_id: string;
  measured_at: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      settings: { Row: Settings; Insert: Partial<Settings>; Update: Partial<Settings> };
      medications: { Row: Medication; Insert: Partial<Medication>; Update: Partial<Medication> };
      medication_logs: { Row: MedicationLog; Insert: Partial<MedicationLog>; Update: Partial<MedicationLog> };
      glucose_logs: { Row: GlucoseLog; Insert: Partial<GlucoseLog>; Update: Partial<GlucoseLog> };
      weight_logs: { Row: WeightLog; Insert: Partial<WeightLog>; Update: Partial<WeightLog> };
      blood_pressure_logs: { Row: BloodPressureLog; Insert: Partial<BloodPressureLog>; Update: Partial<BloodPressureLog> };
    };
  };
}
