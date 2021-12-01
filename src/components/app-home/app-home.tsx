import { Component, ComponentInterface, h, Host, State } from '@stencil/core';
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
  @State() user: User;

  async componentDidLoad() {
    await this.fetchFileTree();
    await this.fetchUser();
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
                  if (this.user) {
                    await fetch(
                      'http://localhost:5000/auth/sign-out',
                      {
                        method: 'POST',
                        credentials: 'include'
                      }
                    );
                    this.fetchUser();
                  } else {
                    const popover = await popoverController.create({
                      component: 'app-sign-in',
                      translucent: true,
                      id: 'sign-in'
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
                  <ion-col size="12" style={{ height: '50%' }}>
                    <ion-card>
                      <ion-toolbar color="secondary">
                        <ion-title>Files</ion-title>
                        <ion-buttons slot="end">
                          <ion-button title="Create file">
                            <ion-icon slot="icon-only" name="add"></ion-icon>
                          </ion-button>
                          <ion-button title="Refresh" onClick={() => this.fetchFileTree()}>
                            <ion-icon slot="icon-only" name="refresh"></ion-icon>
                          </ion-button>
                        </ion-buttons>
                      </ion-toolbar>
                      <ion-card-content>
                        <ion-list>
                          <app-tree-view
                            data={this.fileTree}
                            onItemClicked={async ({ detail }) => {
                              const rootPath = `${this.fileTree.name}/`;
                              const path = detail.path?.slice(rootPath.length);
                              const fileContent = await this.fetchFileContent(path);
                              if (this.monacoEditorElement) {
                                this.monacoEditorElement.value = fileContent;
                                // TODO detect language
                                this.monacoEditorElement.language = 'python';
                              }
                            }} />
                        </ion-list>
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                  <ion-col size="12" style={{ height: '50%' }}>
                    <ion-card>
                      <ion-toolbar color="secondary">
                        <ion-segment scrollable>
                          <ion-segment-button>Variables</ion-segment-button>
                          <ion-segment-button>Charts</ion-segment-button>
                        </ion-segment>
                      </ion-toolbar>
                      <ion-card-content>content</ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-col>
              <ion-col size="9">
                <ion-card>
                  <ion-toolbar color="secondary">
                    <ion-title>No File Selected</ion-title>
                    <ion-buttons slot="end">
                      <ion-button title="Run">
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
                  <ion-card-content style={{ height: 'calc(100% - 56px)' }} >
                    <s-monaco-editor ref={(el: HTMLSMonacoEditorElement) => this.monacoEditorElement = el} />
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </Host>
    );
  }

  private async fetchFileTree() {
    const response = await fetch(
      'http://localhost:5000/file/tree',
      { credentials: 'include' }
    );
    const fileTree = await response.json();
    this.fileTree = fileTree;
  }

  private async fetchFileContent(path: string) {
    const searchParams = new URLSearchParams({ path });
    const searchParamsString = searchParams.toString();
    const response = await fetch(
      `http://localhost:5000/file?${searchParamsString}`,
      { credentials: 'include' }
    );
    const text = await response.text();
    return text;
  }

  private async fetchUser() {
    const response = await fetch(
      'http://localhost:5000/user/me',
      { credentials: 'include' }
    );
    if (response.ok) {
      this.user = await response.json();
    } else {
      this.user = undefined;
    }
    this.fetchFileTree();
  }

}
