import { SimpleAccordion } from "../../../../common/Accordion";
import { usePubSub } from "../../../../../contexts/PubSub";
import { useLayout } from "../../../../../contexts/Layout";
import Input from "./Input";
import OutputGenerator from "./OutputGenerator";
import InputGenerator from "./InputGenerator";
import EnkiSelect from "./EnkiSelect";
import css from "./datacontrols.module.css";

const StubComponent = (props) => <div>{props.name}</div>;

const LongText = ({ initialValue, name, dataKey, nodeId }) => {
  const { events, publish } = usePubSub();
  const { createOrFocus, componentTypes } = useLayout();

  const onClick = () => {
    const data = {
      data: initialValue,
      nodeId,
      dataKey,
      name,
    };
    publish(events.TEXT_EDITOR_SET, data);
    createOrFocus(componentTypes.TEXT_EDITOR, "Text Editor");
  };

  return <button onClick={onClick}>Open in text editor</button>;
};

const controlMap = {
  enkiSelect: EnkiSelect,
  outputGenerator: OutputGenerator,
  inputGenerator: InputGenerator,
  longText: LongText,
  input: Input,
  slider: StubComponent,
  dial: StubComponent,
};

const DataControls = ({
  dataControls,
  updateData,
  width,
  data,
  nodeId,
  ...props
}) => {
  if (!dataControls)
    return <p className={css["message"]}>No component selected</p>;
  if (Object.keys(dataControls).length < 1)
    return (
      <p className={css["message"]}>
        Selected component has nothing to inspect
      </p>
    );

  return (
    <>
      {Object.entries(dataControls).map(([key, control]) => {
        // Default props to pass through to every data control
        const controlProps = {
          nodeId,
          width,
          control,
          initialValue: data[control.dataKey] || "",
          updateData,
        };

        const Component =
          controlMap[control.controls.component] || StubComponent;

        return (
          <SimpleAccordion heading={control.name || key} key={key}>
            <Component {...controlProps} />
          </SimpleAccordion>
        );
      })}
    </>
  );
};

export default DataControls;