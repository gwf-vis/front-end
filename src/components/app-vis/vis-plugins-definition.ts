export interface VisPluginsDefinition {
  name: string;
  path: string;
  exportName: string;
  requires?: string[];
  plugins?: VisPluginsDefinition[];
  description?: string;
}
