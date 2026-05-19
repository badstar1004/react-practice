/**
 * CodeSelectRenderer.jsx
 *
 * AG Grid 용도(UsageCd) 컬럼용 셀 렌더러
 *
 * - 조회 모드: 코드명 텍스트 표시
 * - 수정 모드: CodeSelect 표시, 변경 시 context.addChangedRow 호출
 * - setDataValue + setTimeout(addChangedRow): 그리드 반영 및 React state 동기화
 */

import React from "react";
import CodeSelect from "components/common/CodeSelect";

const toStringValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const findCodeName = (options, value) => {
  const list = options || [];
  const found = list.find((item) => {
    return toStringValue(item.code) === toStringValue(value);
  });

  return found ? found.name : value || "-";
};

class CodeSelectRenderer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value || "",
    };
  }

  /** AG Grid 셀 갱신 시 호출 */
  refresh(params) {
    this.setState({
      value: params.value || "",
    });

    return true;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value || "",
      });
    }
  }

  /** row click 이벤트와 select 클릭 충돌 방지 */
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

    const field = this.props.field || this.props.colDef.field;

    this.setState({
      value: value,
    });

    const updatedRow = Object.assign({}, this.props.node.data);
    updatedRow[field] = value;

    this.props.node.setDataValue(field, value);

    if (this.props.context && this.props.context.addChangedRow) {
      window.setTimeout(() => {
        this.props.context.addChangedRow(updatedRow, field, value);
      }, 0);
    }
  };

  render() {
    const options = this.props.options || [];
    const editable = this.props.editable === true;

    if (!editable) {
      return <span>{findCodeName(options, this.state.value)}</span>;
    }

    return (
      <div onMouseDown={this.handleMouseDown} onClick={this.handleClick}>
        <CodeSelect
          value={this.state.value}
          options={options}
          placeholder={this.props.placeholder || "선택하세요."}
          onChange={this.handleChange}
          className="grid-select"
        />
      </div>
    );
  }
}

export default CodeSelectRenderer;
