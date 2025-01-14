import {
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import {
  useService
} from '../../../hooks';

import {
  isTimerSupported,
  getTimerEventDefinition,
  getTimerDefinitionType
} from '../utils/EventDefinitionUtil';

import SelectEntry, { isEdited as selectIsEdited } from '@bpmn-io/properties-panel/lib/components/entries/Select';
import TextField, { isEdited as textFieldIsEdited } from '@bpmn-io/properties-panel/lib/components/entries/TextField';


/**
 * @typedef { import('@bpmn-io/properties-panel/lib/PropertiesPanel').EntryDefinition } Entry
 */

/**
 * @returns {Array<Entry>} entries
 */
export function TimerProps(props) {
  const {
    element
  } = props;

  const businessObject = getBusinessObject(element),
        timerEventDefinition = getTimerEventDefinition(businessObject),
        timerEventDefinitionType = getTimerDefinitionType(timerEventDefinition);

  // (1) Only show for supported elements
  if (!isTimerSupported(element)) {
    return [];
  }

  // (2) Provide entries, have a value only if selection was made
  const entries = [];

  entries.push({
    id: 'timerEventDefinitionType',
    component: <TimerEventDefinitionType element={ element } />,
    isEdited: selectIsEdited
  });

  if (timerEventDefinitionType) {
    entries.push({
      id: 'timerEventDefinitionValue',
      component: <TimerEventDefinitionValue element={ element } />,
      isEdited: textFieldIsEdited
    });
  }

  return entries;
}


/**
 * TimerEventDefinitionType - Generic select entry allowing to select a specific
 * timerEventDefintionType. To be used together with timerEventDefinitionValue.
 *
 * @param  {type} props
 * @return {SelectEntry}
 */
function TimerEventDefinitionType(props) {
  const {
    element
  } = props;

  const commandStack = useService('commandStack'),
        bpmnFactory = useService('bpmnFactory'),
        translate = useService('translate');

  const businessObject = getBusinessObject(element),
        timerEventDefinition = getTimerEventDefinition(businessObject),
        timerEventDefinitionType = getTimerDefinitionType(timerEventDefinition);

  const getValue = () => {
    return timerEventDefinitionType || '';
  };

  const setValue = (value) => {

    // (1) Check if value is different to current type
    if (value === timerEventDefinitionType) {
      return;
    }

    // (2) Create empty formalExpression element
    const formalExpression = bpmnFactory.create('bpmn:FormalExpression', { body: undefined });
    formalExpression.$parent = timerEventDefinition;

    // (3) Set the value for selected timerEventDefinitionType
    const newProps = {
      timeDuration: undefined,
      timeDate: undefined,
      timeCycle: undefined
    };
    newProps[value] = formalExpression;

    // (4) Execute businessObject update
    commandStack.execute('properties-panel.update-businessobject', {
      element: element,
      businessObject: timerEventDefinition,
      properties: newProps
    });
  };

  const getOptions = (element) => {
    return [
      { value: '', label: translate('<none>') },
      { value: 'timeDate', label: translate('Date') },
      { value: 'timeDuration', label: translate('Duration') },
      { value: 'timeCycle', label: translate('Cycle') }
    ];
  };

  return SelectEntry({
    element,
    id: 'timerEventDefinitionType',
    label: translate('Type'),
    getValue,
    setValue,
    getOptions
  });
}

/**
 * TimerEventDefinitionValue - Generic textField entry allowing to specify the
 * timerEventDefintionValue based on the set timerEventDefintionType. To be used
 * together with timerEventDefinitionType.
 *
 * @param  {type} props
 * @return {TextField}
 */
function TimerEventDefinitionValue(props) {
  const {
    element
  } = props;

  const commandStack = useService('commandStack'),
        translate = useService('translate'),
        debounce = useService('debounceInput');

  const businessObject = getBusinessObject(element),
        timerEventDefinition = getTimerEventDefinition(businessObject),
        timerEventDefinitionType = getTimerDefinitionType(timerEventDefinition),
        timerEventFormalExpression = timerEventDefinition.get(timerEventDefinitionType);

  const getValue = () => {
    return timerEventFormalExpression && timerEventFormalExpression.get('body');
  };

  const setValue = (value) => {
    commandStack.execute('properties-panel.update-businessobject', {
      element: element,
      businessObject: timerEventFormalExpression,
      properties: {
        body: value
      }
    });
  };

  return TextField({
    element,
    id: 'timerEventDefinitionValue',
    label: translate('Value'),
    getValue,
    setValue,
    debounce,
    description: getTimerEventDefinitionValueDescription(timerEventDefinitionType, translate)
  });
}


// helper //////////////////////////

function getTimerEventDefinitionValueDescription(timerDefinitionType, translate) {
  switch (timerDefinitionType) {
  case 'timeDate':
    return (<div>
      <p>{ translate('A specific point in time defined as ISO 8601 combined date and time representation.') }</p>
      <ul>
        <li><code>2019-10-01T12:00:00Z</code> - { translate('UTC time') }</li>
        <li><code>2019-10-02T08:09:40+02:00</code> - { translate('UTC plus 2 hours zone offset') }</li>
      </ul>
      <a href="https://docs.camunda.org/manual/latest/reference/bpmn20/events/timer-events/#time-date" target="_blank" rel="noopener">{ translate('Documentation: Timer events') }</a>
    </div>);

  case 'timeCycle':
    return (<div>
      <p>{ translate('A cycle defined as ISO 8601 repeating intervals format.') }</p>
      <ul>
        <li><code>R5/PT10S</code> - { translate('every 10 seconds, up to 5 times') }</li>
        <li><code>R/P1D</code> - { translate('every day, infinitely') }</li>
      </ul>
      <a href="https://docs.camunda.org/manual/latest/reference/bpmn20/events/timer-events/#time-cycle" target="_blank" rel="noopener">{ translate('Documentation: Timer events') }</a>
    </div>);

  case 'timeDuration':
    return (<div>
      <p>{ translate('A time duration defined as ISO 8601 durations format.') }</p>
      <ul>
        <li><code>PT15S</code> - { translate('15 seconds') }</li>
        <li><code>PT1H30M</code> - { translate('1 hour and 30 minutes') }</li>
        <li><code>P14D</code> - { translate('14 days') }</li>
      </ul>
      <a href="https://docs.camunda.org/manual/latest/reference/bpmn20/events/timer-events/#time-duration" target="_blank" rel="noopener">{ translate('Documentation: Timer events') }</a>
    </div>);
  }
}
