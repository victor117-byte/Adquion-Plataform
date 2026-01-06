export function PowerBISection() {
  return (
    <div className="h-full w-full">
      <div className="space-y-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Power BI</h1>
          <p className="text-muted-foreground mt-1">
            Visualiza reportes y análisis de datos
          </p>
        </div>
      </div>
      
      <div className="relative w-full" style={{ height: 'calc(100vh - 200px)' }}>
        <iframe
          title="Power BI Report"
          src="https://app.powerbi.com/view?r=eyJrIjoiMzMzOTY2NWMtYWYyNC00NTIxLTlmY2UtYTk2NTY2MjhmYmRiIiwidCI6IjI4OTZiZDI4LWQ4MDAtNDBjYi04YzM0LWJhN2E1YmFhMTBiYiIsImMiOjR9"
          className="w-full h-full border-0 rounded-lg shadow-lg"
          allowFullScreen
        />
      </div>
    </div>
  );
}
