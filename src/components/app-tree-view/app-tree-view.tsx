import { Component, Host, h, ComponentInterface, Element, Prop } from '@stencil/core';

export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

@Component({
  tag: 'app-tree-view',
  styleUrl: 'app-tree-view.css',
  shadow: true,
})
export class AppTreeView implements ComponentInterface {

  @Element() hostElement: HTMLAppTreeViewElement;

  @Prop() data: TreeNode = {
    name: 'data',
    children: [
      {
        name: 'personal',
        children: [
          {
            name: 'data',
            children: [
              { name: '1.json' },
              { name: '2.json' }
            ]
          },
          {
            name: 'out',
            children: []
          }
        ]
      },
      {
        name: 'public',
        children: [
          {
            name: 'data',
            children: [
              { name: '1.json' },
              { name: '2.json' }
            ]
          }
        ]
      }
    ]
  };

  render() {
    return (
      <Host>
        {this.renderTreeNode(this.data, true)}
      </Host>
    );
  }

  private renderTreeNode(treeNode: TreeNode, root?: boolean) {
    return (
      <ul id={root ? 'tree-root' : ''} class={root ? '' : 'nested'}>
        {
          treeNode.children?.map(childNode =>
            childNode.children ?
              <li>
                <span class="caret" onClick={event => {
                  const target = event.currentTarget as HTMLSpanElement;
                  target.parentElement.querySelector('.nested').classList.toggle('active');
                  target.classList.toggle('caret-down');
                }}>{childNode.name}</span>
                {this.renderTreeNode(childNode)}
              </li> :
              <li>{childNode.name}</li>
          )
        }
      </ul>
    )
  }

}
