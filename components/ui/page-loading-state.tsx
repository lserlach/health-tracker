interface PageLoadingStateProps {
  label?: string;
}

export function PageLoadingState({ label = "Загрузка..." }: PageLoadingStateProps) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>;
}
