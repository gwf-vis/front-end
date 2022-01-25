import { Component, ComponentInterface, Env, h, Host, State } from '@stencil/core';
import '@seanwong24/s-monaco-editor';
import { TreeNode } from '../app-tree-view/app-tree-view';
import { popoverController } from '@ionic/core';

export interface User {
  username: string;
  role: string;
}

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css',
  scoped: true,
})
export class AppHome implements ComponentInterface {
  private monacoEditorElement: HTMLSMonacoEditorElement;

  @State() fileTree: TreeNode;
  @State() datasetTree: TreeNode;
  @State() user: User;
  @State() selectedFilePath: string;
  @State() selectedTab = 'scripts';

  async componentDidLoad() {
    await this.fetchFileTree();
    await this.fetchUser();

    const datasets = this.fileTree?.children
      ?.find(child => child.name === 'public')
      ?.children?.find(child => child.name === 'data')
      ?.children.map(child => ({
        name: child.name,
        children: child?.children?.find(child => child.name === 'data')?.children?.map(child => ({ name: child.name })),
      }));
    this.datasetTree = {
      name: 'root',
      children: [{ name: 'public', children: datasets }],
    };
  }

  render() {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Advanced Vis</ion-title>
            <ion-text slot="end">{this.user?.username || 'Guest'}</ion-text>
            <ion-buttons slot="end">
              <ion-button
                title={this.user ? 'Sign out' : 'Sign in'}
                onClick={async () => {
                  debugger;
                  if (this.user) {
                    await fetch(`${Env.SERVER_BASE_URL}/auth/sign-out`, {
                      method: 'POST',
                      credentials: 'include',
                    });
                    this.fetchUser();
                  } else {
                    const popover = await popoverController.create({
                      component: 'app-sign-in',
                      translucent: true,
                      id: 'sign-in',
                    });
                    popover.addEventListener('ionPopoverDidDismiss', () => this.fetchUser());
                    await popover.present();
                  }
                }}
              >
                <ion-icon name={this.user ? 'log-out' : 'log-in'} slot="icon-only" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content scrollY={false}>
          <ion-grid>
            <ion-row>
              <ion-col size="3" style={{ padding: '0' }}>
                <ion-row style={{ padding: '0' }}>
                  <ion-col size="12">
                    <ion-card>
                      <ion-toolbar color="secondary">
                        <ion-segment scrollable value={this.selectedTab} onIonChange={({ detail }) => (this.selectedTab = detail.value)}>
                          <ion-segment-button value="scripts">Scripts</ion-segment-button>
                          <ion-segment-button value="datasets">Datasets</ion-segment-button>
                          <ion-segment-button value="files">Files</ion-segment-button>
                        </ion-segment>
                      </ion-toolbar>
                      <ion-card-content>
                        {this.selectedTab === 'scripts' && this.renderScriptsView()}
                        {this.selectedTab === 'datasets' && this.renderDatasetsView()}
                        {this.selectedTab === 'files' && this.renderFilesView()}
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-col>
              <ion-col size="9">
                <ion-card>
                  <ion-toolbar color="secondary">
                    <ion-title>{this.selectedFilePath || 'No File Selected'}</ion-title>
                    <ion-buttons slot="end">
                      <ion-button
                        title="Run"
                        onClick={async () => {
                          const response = await fetch(`${Env.SERVER_BASE_URL}/file/run`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              code: this.monacoEditorElement.value,
                            }),
                          });
                          if (response.ok) {
                            const data = await response.json();
                            const id = data.id;
                            window.open('./#/vis/' + id);
                          }
                        }}
                      >
                        <ion-icon slot="icon-only" name="play"></ion-icon>
                      </ion-button>
                      <ion-button title="Clear">
                        <ion-icon slot="icon-only" name="trash"></ion-icon>
                      </ion-button>
                      <ion-button title="Documentation">
                        <ion-icon slot="icon-only" name="help"></ion-icon>
                      </ion-button>
                    </ion-buttons>
                  </ion-toolbar>
                  {/* TODO considering using flex or resize observer for the height */}
                  <ion-card-content style={{ height: 'calc(100% - 56px)' }}>
                    <s-monaco-editor ref={(el: HTMLSMonacoEditorElement) => (this.monacoEditorElement = el)} />
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </Host>
    );
  }

  private renderScriptsView() {
    const scripts = this.fileTree?.children?.find(child => child.name === 'public')?.children?.find(child => child.name === 'scripts')?.children;
    const scriptsTree = {
      name: 'root',
      children: [{ name: 'public', children: scripts }],
    };
    return (
      <app-tree-view
        data={scriptsTree}
        onItemClicked={async ({ detail }) => {
          if (!detail.children) {
            const rootPath = `${this.fileTree.name}/`;
            const path = detail.path?.slice(rootPath.length);
            const fileContent = await this.fetchFileContent(path);
            if (this.monacoEditorElement) {
              this.monacoEditorElement.value = fileContent;
              // TODO detect language
              this.monacoEditorElement.language = 'python';
            }
            this.selectedFilePath = path;
          }
        }}
        onItemRightClicked={({ detail }) => alert(detail.name)}
      />
    );
  }

  private renderDatasetsView() {
    return <app-tree-view data={this.datasetTree} />;
  }

  private renderFilesView() {
    return (
      <ion-list>
        <app-tree-view
          data={this.fileTree}
          onItemClicked={async ({ detail }) => {
            if (!detail.children) {
              const rootPath = `${this.fileTree.name}/`;
              const path = detail.path?.slice(rootPath.length);
              const fileContent = await this.fetchFileContent(path);
              if (this.monacoEditorElement) {
                this.monacoEditorElement.value = fileContent;
                // TODO detect language
                this.monacoEditorElement.language = 'python';
              }
              this.selectedFilePath = path;
            }
          }}
        />
      </ion-list>
    );
  }

  private async fetchFileTree() {
    const response = await fetch(`${Env.SERVER_BASE_URL}/file/tree`, { credentials: 'include' });
    const fileTree = await response.json();
    this.fileTree = fileTree;
  }

  private async fetchFileContent(path: string) {
    const response = await fetch(`${Env.SERVER_BASE_URL}/files/${path}`, { credentials: 'include' });
    const text = await response.text();
    return text;
  }

  private async fetchUser() {
    const response = await fetch(`${Env.SERVER_BASE_URL}/user/me`, { credentials: 'include' });
    if (response.ok) {
      this.user = await response.json();
    } else {
      this.user = undefined;
    }
    this.fetchFileTree();
  }
}
