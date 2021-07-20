import Rete from "rete";
import { EnkiThroughputControl } from "../dataControls/EnkiThroughputControl";
import { postEnkiCompletion } from "../../../services/game-api/enki";
import { DisplayControl } from "../controls/DisplayControl";

export class EnkiTask extends Rete.Component {
  constructor() {
    // Name of the component
    super("Enki Task");

    this.task = {
      outputs: { data: "option" },
    };
  }

  node = {};

  builder(node) {
    const EnkiOutput = new EnkiThroughputControl({
      defaultOutputs: node.data.outputs,
      socketType: "dataSocket",
      taskType: "option",
      nodeId: node.id,
    });

    const display = new DisplayControl({
      key: `display-${node.id}`,
      defaultDisplay: "Awaiting result...",
    });

    this.displayControl = display;
    node.addControl(display);
    node.inspector.add(EnkiOutput);

    return node;
  }

  async worker(node, inputs, outputs) {
    const completionResponse = await postEnkiCompletion(
      node.data.name,
      Object.values(inputs).map((inputArray) => inputArray[0])
    );

    const test = completionResponse.outputs.reduce(
      (compiledOutputs, output, outputNumber) => {
        compiledOutputs[`output ${outputNumber + 1}`] = output;
        return compiledOutputs;
      },
      {}
    );
    this.displayControl.display(completionResponse.outputs.join(" "));

    return test;
  }
}