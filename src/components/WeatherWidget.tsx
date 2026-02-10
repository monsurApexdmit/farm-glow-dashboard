import { CloudSun, Droplets, Wind, Thermometer } from "lucide-react";

export function WeatherWidget() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <h3 className="font-display font-semibold text-base mb-4">Weather Today</h3>
      <div className="flex items-center gap-4 mb-4">
        <CloudSun className="w-12 h-12 text-accent" />
        <div>
          <p className="text-3xl font-bold font-display">28°C</p>
          <p className="text-sm text-muted-foreground">Partly Cloudy</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Droplets className="w-4 h-4 text-chart-blue" />
          <span className="text-muted-foreground">65%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Wind className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">12 km/h</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-chart-red" />
          <span className="text-muted-foreground">32°C max</span>
        </div>
      </div>
    </div>
  );
}
