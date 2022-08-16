import { Component, ComponentInterface, Env, h, Host, State } from '@stencil/core';
import '@seanwong24/s-monaco-editor';
import { TreeNode } from '../app-tree-view/app-tree-view';

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
  @State() scriptOutput = '';

  async componentDidLoad() {
    await this.checkPAWSLogin();

    await this.fetchFileTree();
    await this.fetchUser();
    await this.fetchDatasetTree();
  }

  render() {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>
              <img src="./assets/icon/gwf-simple-horizontal.svg" style={{ maxHeight: '48px', contentFit: 'cover' }}></img>
            </ion-title>
            <ion-text slot="end">{this.user?.username || 'Guest'}</ion-text>
            <ion-buttons slot="end">
              <ion-button
                title={this.user ? 'Sign out' : 'Sign in'}
                href={
                  this.user ? undefined : `https://cas.usask.ca/cas/login?service=${encodeURIComponent(window.location.href + (window.location.href.endsWith('/') ? '' : '/'))}`
                }
                onClick={async () => {
                  if (this.user) {
                    await fetch(`${Env.SERVER_BASE_URL}/auth/sign-out`, {
                      method: 'POST',
                      credentials: 'include',
                    });
                    this.fetchUser();
                    window.location.href = `https://cas.usask.ca/cas/logout?service=${encodeURIComponent(window.location.href + (window.location.href.endsWith('/') ? '' : '/'))}`;
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
                <ion-row>
                  <ion-col size="12" style={{ padding: '0', height: '70%' }}>
                    <ion-card>
                      <ion-toolbar color="secondary">
                        <ion-title>{this.selectedFilePath || 'No File Selected'}</ion-title>
                        <ion-buttons slot="end">
                          <ion-button title="Save" onClick={() => this.updateFile(this.selectedFilePath, this.monacoEditorElement.value)}>
                            <ion-icon slot="icon-only" name="save"></ion-icon>
                          </ion-button>
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
                                this.scriptOutput += '\n' + data.output;
                                if (data.result) {
                                  window.open('./#/vis/' + id);
                                }
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
                  <ion-col size="12">
                    <ion-card style={{ padding: '0', height: '30%' }}>
                      <ion-card-content style={{ height: '100%', overflowY: 'auto' }}>
                        {this.scriptOutput?.split('\n').map(line =>
                          line.match(/^data:image\/*;*,*/) ? (
                            <div>
                              <img src={line} style={{ maxHeight: '10rem' }} />
                              <a href={line} download>
                                Download
                              </a>
                            </div>
                          ) : (
                            <p>{line}</p>
                          ),
                        )}
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </Host>
    );
  }

  private renderScriptsView() {
    const children = this.fileTree?.children?.map(child => {
      const editable = child.name === this.user?.username;
      return {
        name: child.name,
        children: child?.children?.map(child => ({ ...child, editable })),
        editable,
      };
    });
    const scriptsTree = {
      name: 'root',
      children: children,
    };
    return (
      <app-tree-view
        data={scriptsTree}
        onItemClicked={async ({ detail }) => {
          if (!detail.children) {
            const rootPath = `${this.fileTree.path}/`;
            const path = detail.path?.slice(rootPath.length);
            const fileContent = await this.fetchFileContent(path);
            if (this.monacoEditorElement) {
              this.monacoEditorElement.value = fileContent;
              // TODO detect language
              this.monacoEditorElement.language = path.split('.').pop() === 'js' ? 'javascript' : 'python';
            }
            this.selectedFilePath = path;
          }
        }}
        onItemRightClicked={({ detail }) => {
          if (detail.editable) {
            if (detail.children) {
              const fileName = prompt('Creating a new file');
              if (fileName !== null) {
                this.createFile(`${this.user?.username}/scripts/${fileName}`, '');
              }
            } else {
              if (confirm(`Delete ${detail.name}?`)) {
                this.deleteFile(`${this.user?.username}/scripts/${detail.name}`);
              }
            }
          }
        }}
      />
    );
  }

  private renderDatasetsView() {
    return <app-tree-view data={this.datasetTree} onItemClicked={({ detail }) => !detail.children && alert(detail['description'])} />;
  }

  private renderFilesView() {
    return (
      <ion-list>
        <app-tree-view
          data={this.fileTree}
          onItemClicked={async ({ detail }) => {
            if (!detail.children) {
              const rootPath = `${this.fileTree.path}/`;
              const path = detail.path?.slice(rootPath.length);
              const fileContent = await this.fetchFileContent(path);
              if (this.monacoEditorElement) {
                this.monacoEditorElement.value = fileContent;
                // TODO detect language
                this.monacoEditorElement.language = path.split('.').pop() === 'js' ? 'javascript' : 'python';
              }
              this.selectedFilePath = path;
            }
          }}
          onItemRightClicked={({ detail }) => {
            debugger;
            if (detail.editable) {
              if (detail.children) {
                const fileName = prompt('Creating a new file');
                const rootPath = `${this.fileTree.path}/`;
                const filePath = `${detail.path?.slice(rootPath.length)}/${fileName}`;
                if (filePath !== null) {
                  this.createFile(filePath, '');
                }
              } else {
                if (confirm(`Delete ${detail.name}?`)) {
                  const rootPath = `${this.fileTree.path}/`;
                  const filePath = detail.path?.slice(rootPath.length);
                  this.deleteFile(filePath);
                }
              }
            }
          }}
        />
      </ion-list>
    );
  }

  private async checkPAWSLogin() {
    const ticketMatch = window.location.href.match(/\?ticket=ST-.+-cas/);
    if (ticketMatch) {
      const [_, ticket] = ticketMatch[0].split('ticket=');
      const hrefWithoutQueryParameters = window.location.href.split('?ticket=')[0];
      const service = encodeURIComponent(hrefWithoutQueryParameters + (hrefWithoutQueryParameters.endsWith('/') ? '' : '/'));
      await fetch(`${Env.SERVER_BASE_URL}/auth/sign-in?service=${service}&ticket=${ticket}`, { method: 'POST', credentials: 'include' });
      window.location.href = hrefWithoutQueryParameters;
    }
  }

  private async fetchFileTree() {
    try {
      const response = await fetch(`${Env.SERVER_BASE_URL}/file/tree`, { credentials: 'include' });
      const fileTree = await response.json();
      this.fileTree = fileTree;
    } catch (e) {
      console.log(e);
    }
  }

  private async fetchFileContent(path: string) {
    const response = await fetch(`${Env.SERVER_BASE_URL}/file/fetch/${path}`, { credentials: 'include' });
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

  private async fetchDatasetTree() {
    const children = await Promise.all(
      this.fileTree?.children?.map(async rootChild => ({
        name: rootChild.name,
        children: await Promise.all(
          rootChild?.children
            ?.find(child => child.name === 'data')
            ?.children?.map(async child => {
              const datasetInfo = JSON.parse(await this.fetchFileContent(`${rootChild.name}/data/${child.name}/index.json`));
              return {
                name: child.name,
                children: datasetInfo.variables,
              };
            })
            .filter(Boolean) || [],
        ),
      })),
    );
    const datasetTree = {
      name: 'root',
      children,
    };
    this.datasetTree = datasetTree;
  }

  private async createFile(path: string, content: string) {
    await fetch(`${Env.SERVER_BASE_URL}/file?path=${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    this.fetchFileTree();
  }

  private async updateFile(path: string, content: string) {
    await fetch(`${Env.SERVER_BASE_URL}/file?path=${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    this.fetchFileTree();
  }

  private async deleteFile(path: string) {
    await fetch(`${Env.SERVER_BASE_URL}/file?path=${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    this.fetchFileTree();
  }
}
