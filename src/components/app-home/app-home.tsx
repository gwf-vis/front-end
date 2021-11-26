import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css',
  scoped: true,
})
export class AppHome {
  render() {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Advanced Vis</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content scrollY={false}>
          <ion-grid>
            <ion-row>
              <ion-col size="3">
                <ion-card>
                  <ion-toolbar color="secondary">
                    <ion-title>Files</ion-title>
                    <ion-buttons slot="end">
                      <ion-button title="Create file">
                        <ion-icon slot="icon-only" name="add"></ion-icon>
                      </ion-button>
                    </ion-buttons>
                  </ion-toolbar>
                  <ion-card-content>
                    <ion-list>
                      <app-tree-view />
                    </ion-list>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="6">
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
                  <ion-card-content>content</ion-card-content>
                </ion-card>
              </ion-col>
              <ion-col size="3" style={{ padding: '0' }}>
                <ion-row style={{ padding: '0' }}>
                  <ion-col size="12" style={{ height: '50%' }}>
                    <ion-card>
                      <ion-card-header color="secondary">
                        <ion-card-title>Variables</ion-card-title>
                      </ion-card-header>
                      <ion-card-content>content</ion-card-content>
                    </ion-card>
                  </ion-col>
                  <ion-col size="12" style={{ height: '50%' }}>
                    <ion-card>
                      <ion-card-header color="secondary">
                        <ion-card-title>Charts</ion-card-title>
                      </ion-card-header>
                      <ion-card-content>content</ion-card-content>
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
}
