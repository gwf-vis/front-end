import { Component, Host, h, ComponentInterface, Element, Prop, Env } from '@stencil/core';
import { VisPluginsDefinition } from './vis-plugins-definition';

@Component({
  tag: 'app-vis',
  styleUrl: 'app-vis.css',
  shadow: true,
})
export class AppVis implements ComponentInterface {
  @Element() hostElement: HTMLAppVisElement;

  @Prop() pluginUrl = `${Env.SERVER_BASE_URL}/files/public/plugins/vis-main`;
  @Prop() visId: string;

  async componentDidLoad() {
    const data = await (await fetch(`${Env.SERVER_BASE_URL}/file/vis?id=${this.visId}`)).json();
    this.loadPlugin(data);
  }

  render() {
    return <Host></Host>;
  }

  private async loadPlugin(data: any) {
    const pluginsDefinitionUrl = this.pluginUrl + '/index.json';
    const pluginsDefinition = await (await fetch(pluginsDefinitionUrl)).json();
    const pluginTagName = await this.importPlugin(pluginsDefinition);
    const pluginElement = document.createElement(pluginTagName);
    (pluginElement as any).serverFileAPIPath = `${Env.SERVER_BASE_URL}/files`;
    (pluginElement as any).data = data;
    this.hostElement.shadowRoot.appendChild(pluginElement);
  }

  private async importPlugin(pluginsDefinition: VisPluginsDefinition) {
    for (const definition of Object.values(pluginsDefinition || {})) {
      const pluginUrl = '../' + this.pluginUrl + '/' + definition.path;
      const pluginModule = await import(pluginUrl);
      const plugin = pluginModule[definition.exportName];
      const pluginTagName = plugin['TAG_NAME'];
      this.definePlugin(pluginTagName, plugin);
    }
    return pluginsDefinition['Main'].tagName;
  }

  private definePlugin(tagName: string, plugin: CustomElementConstructor) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, plugin);
    }
  }
}
