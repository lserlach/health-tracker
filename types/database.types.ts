export type IntakeRelation =
  | "before_food"
  | "after_food"
  | "with_food"
  | "any";

export type MedicationLogStatus = "pending" | "taken" | "skipped";

export type GlucoseMeasurementType = "fasting" | "after_meal";

export type GlucoseMealSlot =
  | "breakfast"
  | "second_breakfast"
  | "lunch"
  | "afternoon_snack"
  | "dinner";

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
  notify_glucose: boolean;
  notify_medications: boolean;
  notify_weight: boolean;
  notify_blood_pressure: boolean;
  notify_glucose_time: string;
  notify_glucose_repeat_count: number;
  notify_glucose_times: string[];
  notify_weight_time: string;
  notify_weight_repeat_count: number;
  notify_weight_times: string[];
  notify_blood_pressure_time: string;
  notify_blood_pressure_repeat_count: number;
  notify_blood_pressure_times: string[];
  notify_medications_repeat_count: number;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface NotificationReminderSent {
  id: string;
  user_id: string;
  reminder_key: string;
  sent_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  icon: string;
  icon_color: string;
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

export interface MealLog {
  id: string;
  user_id: string;
  eaten_at: string;
  meal_text: string;
  remind_at: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlucoseLog {
  id: string;
  user_id: string;
  measured_at: string;
  value: number;
  measurement_type: GlucoseMeasurementType;
  meal_slot: GlucoseMealSlot | null;
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
      push_subscriptions: { Row: PushSubscription; Insert: Partial<PushSubscription>; Update: Partial<PushSubscription> };
      notification_reminders_sent: { Row: NotificationReminderSent; Insert: Partial<NotificationReminderSent>; Update: Partial<NotificationReminderSent> };
      meal_logs: { Row: MealLog; Insert: Partial<MealLog>; Update: Partial<MealLog> };
      medications: { Row: Medication; Insert: Partial<Medication>; Update: Partial<Medication> };
      medication_logs: { Row: MedicationLog; Insert: Partial<MedicationLog>; Update: Partial<MedicationLog> };
      glucose_logs: { Row: GlucoseLog; Insert: Partial<GlucoseLog>; Update: Partial<GlucoseLog> };
      weight_logs: { Row: WeightLog; Insert: Partial<WeightLog>; Update: Partial<WeightLog> };
      blood_pressure_logs: { Row: BloodPressureLog; Insert: Partial<BloodPressureLog>; Update: Partial<BloodPressureLog> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
