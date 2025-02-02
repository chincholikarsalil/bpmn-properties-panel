import {
  useContext
} from 'preact/hooks';

import {
  BpmnPropertiesPanelContext
} from '../../../context';

import {
  useService
} from '../../../hooks';

import InputOutputParameter from './InputOutputParameter';

import {
  CreateParameterCmd,
  getOutputParameters,
  getInputOutput
} from '../utils/InputOutputUtil';

import {
  areConnectorsSupported,
  getConnector
} from '../utils/ConnectorUtil';

import {
  createElement
} from '../../../utils/ElementUtil';


export function ConnectorOutputProps(props) {
  const {
    element
  } = props;

  if (!areConnectorsSupported(element)) {
    return null;
  }

  const connector = getConnector(element);

  const outputParameters = getOutputParameters(connector) || [];

  const items = outputParameters.map((parameter, index) => {
    const id = element.id + '-connector-outputParameter-' + index;

    return {
      id,
      label: parameter.get('name') || '',
      entries: InputOutputParameter({
        idPrefix: id,
        element,
        parameter
      }),
      autoFocusEntry: id + '-name',
      remove: RemoveContainer({ parameter })
    };
  });

  return {
    items,
    add: AddOutputParameter
  };
}

function RemoveContainer(props) {
  const {
    parameter
  } = props;

  return function RemoveOutputParameter(props) {
    const {
      children
    } = props;

    const {
      selectedElement: element
    } = useContext(BpmnPropertiesPanelContext);

    const commandStack = useService('commandStack');

    const connector = getConnector(element);

    const removeElement = (event) => {
      event.stopPropagation();

      const inputOutput = getInputOutput(connector);

      if (!inputOutput) {
        return;
      }

      commandStack.execute('properties-panel.update-businessobject-list', {
        element: element,
        currentObject: inputOutput,
        propertyName: 'outputParameters',
        objectsToRemove: [ parameter ]
      });
    };

    return (
      <div onClick={ removeElement }>
        {
          children
        }
      </div>
    );
  };
}

function AddOutputParameter(props) {
  const {
    children
  } = props;

  const {
    selectedElement: element
  } = useContext(BpmnPropertiesPanelContext);

  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');

  const connector = getConnector(element);

  const addElement = (event) => {
    event.stopPropagation();

    const commands = [];

    // (1) ensure inputOutput
    let inputOutput = getInputOutput(connector);

    if (!inputOutput) {
      inputOutput = createElement('camunda:InputOutput', {
        inputParameters: [],
        outputParameters: []
      }, connector, bpmnFactory);

      commands.push({
        cmd: 'properties-panel.update-businessobject',
        context: {
          element: element,
          businessObject: connector,
          properties: {
            inputOutput
          }
        }
      });
    }

    // (2) create + add parameter
    commands.push(
      CreateParameterCmd(element, 'camunda:OutputParameter', inputOutput, bpmnFactory)
    );

    // (3) commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };

  return (
    <div onClick={ addElement }>
      {
        children
      }
    </div>
  );
}