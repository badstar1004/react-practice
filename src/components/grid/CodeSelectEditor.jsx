import React from "react";

class CodeSelectEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedCode: null,
    };

    this.handleChange = this.handleChange.bind(this);
  }

  /*
    AG Grid가 에디터를 셀에 붙인 뒤 호출합니다.
    select에 포커스를 줘서 바로 선택할 수 있게 합니다.
  */
  afterGuiAttached() {
    if (this.selectRef.current) {
      this.selectRef.current.focus();
    }
  }

  /*
    AG Grid가 편집 종료 시 이 값을 가져가서 rowData에 반영합니다.
  */
  getValue() {
    return this.state.value;
  }

  handleChange = (event) => {
    const value = event.target.value;

    this.setState(
      {
        value: value,
      },
      () => {
        /*
          선택하자마자 셀 편집을 종료해서
          onCellValueChanged가 바로 실행되게 합니다.

          AG Grid 버전에 따라 stopEditing이 없을 수 있으므로
          존재할 때만 호출합니다.
        */
        if (this.props.stopEditing) {
          this.props.stopEditing();
        }
      },
    );
  };

  render() {
    const options = this.props.options || [];

    return (
      <select
        ref={this.selectRef}
        value={this.state.value}
        onChange={this.handleChange}
        style={{
          width: "100%",
          height: "100%",
          border: "0",
          outline: "none",
          padding: "0 6px",
          boxSizing: "border-box",
          background: "#fff",
        }}
      >
        <option value="">선택하세요</option>

        {options.map((item) => {
          return (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          );
        })}
      </select>
    );
  }
}

export default CodeSelectEditor;
