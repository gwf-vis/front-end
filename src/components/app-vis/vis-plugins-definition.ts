export interface VisPluginsDefinition {
  [name: string]: {
    exportName: string;
    tagName: string;
    path: string;
    for?: string;
  };
}
