import React from 'react';

import { ReactWidget } from '@jupyterlab/apputils';

import ConfigEditorComponent from './ConfigEditorComponent';

export class ConfigEditorWidget extends ReactWidget {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  render(): JSX.Element {
    return (
      <div id={this.id + '_component'}>
        <ConfigEditorComponent />
      </div>
    );
  }
}

export default ConfigEditorWidget;
