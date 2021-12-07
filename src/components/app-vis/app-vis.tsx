import { Component, Host, h, ComponentInterface, Element, Prop } from '@stencil/core';
import { VisPluginsDefinition } from './vis-plugins-definition';

@Component({
  tag: 'app-vis',
  styleUrl: 'app-vis.css',
  shadow: true,
})
export class AppVis implements ComponentInterface {

  @Element() hostElement: HTMLAppVisElement;

  @Prop() pluginUrl = 'http://localhost:5000/files/public/plugins/vis-main';
  @Prop() data: any = 'hello world';

  componentDidLoad() {
    this.loadPlugin();
  }

  render() {
    return (
      <Host></Host>
    );
  }

  private async loadPlugin() {
    const pluginsDefinitionUrl = this.pluginUrl + '/index.json';
    const pluginsDefinition = await (await fetch(pluginsDefinitionUrl)).json();
    const pluginTagName = await this.importPlugin(pluginsDefinition);
    const pluginElement = document.createElement(pluginTagName);
    (pluginElement as any).data = this.data;
    this.hostElement.shadowRoot.appendChild(pluginElement);
  }

  private async importPlugin(pluginsDefinition: VisPluginsDefinition) {
    const pluginUrl = this.pluginUrl + '/' + pluginsDefinition.path;
    const pluginModule = await import(pluginUrl);
    const plugin = pluginModule[pluginsDefinition.exportName];
    const pluginTagName = plugin['TAG_NAME'];
    this.definePlugin(pluginTagName, plugin);
    pluginsDefinition.requires?.forEach(requiredPluginName => {
      const requiredPluginDefinition = pluginsDefinition.plugins.find(p => p.name === requiredPluginName);
      this.importPlugin(requiredPluginDefinition);
    });
    return pluginTagName;
  }

  private definePlugin(tagName: string, plugin: CustomElementConstructor) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, plugin);
    }
  }

}
