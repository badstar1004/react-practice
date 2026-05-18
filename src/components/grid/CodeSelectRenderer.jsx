import React from "react";
import CodeSelect from "components/common/CodeSelect";

class CodeSelectRenderer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value || "",
    };
  }

  refresh(params) {
    this.setState({
      value: params.value || "",
    });

    return true;
  }

  handleMouseDown = (event) => {
    event.stopPropagation();
  };

  handleClick = (event) => {
    event.stopPropagation();
  };

  handleChange = (value, event) => {
    if (event) {
      event.stopPropagation();
    }

    const field = this.props.colDef.field;

    this.setState({
      value: value,
    });

    const updatedRow = Object.assign({}, this.props.node.data);
    updatedRow[field] = value;

    this.props.node.setDataValue(field, value);

    if (this.props.context && this.props.context.addChangedRow) {
      this.props.context.addChangedRow(updatedRow);
    }
  };

  render() {
    const options = this.props.options || [];

    return (
      <div onMouseDown={this.handleMouseDown} onClick={this.handleClick}>
        <CodeSelect
          value={this.state.value}
          options={options}
          placeholder="선택하세요."
          onChange={this.handleChange}
          className="grid-select"
        />
      </div>
    );
  }
}

export default CodeSelectRenderer;
